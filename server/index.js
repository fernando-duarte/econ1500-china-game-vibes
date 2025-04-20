require('dotenv').config();
// Add global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Prevent hanging on uncaught exceptions
  if (err.code === 'EADDRINUSE') {
    console.log('Port already in use, exiting...');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { setupSocketEvents } = require('./events');
const CONSTANTS = require('../shared/constants');

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO
const io = new Server(server);

// Store IO instance globally for use across modules
global.io = io;

// Store server instance for clean shutdown
let serverInstance = null;

// Only handle critical shutdown signals (not SIGUSR2 which nodemon uses)
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

/**
 * Gracefully shut down the server
 * @param {Function} callback - Optional callback to run after shutdown
 */
function gracefulShutdown(callback) {
  console.log('Shutting down server gracefully...');
  
  // Prevent adding more logic if shutdown already in progress
  if (global.shuttingDown) {
    console.log('Shutdown already in progress, ignoring duplicate call');
    return;
  }
  
  // Set global shutdown flag
  global.shuttingDown = true;
  
  // Create a forceful exit function for worst case
  const forceExit = () => {
    console.error('Forcing exit after timeout');
    process.exit(1);
  };
  
  // Set a timeout for hard exit if graceful shutdown takes too long
  const forceExitTimeout = setTimeout(forceExit, 10000);
  
  // Create cleanup function for consistent shutdown path
  const cleanup = () => {
    if (forceExitTimeout) {
      clearTimeout(forceExitTimeout);
    }
    
    if (typeof callback === 'function') {
      callback();
    } else {
      // Use process.nextTick to ensure any remaining handlers complete
      process.nextTick(() => {
        process.exit(0);
      });
    }
  };
  
  // If no server or socket, just exit
  if (!io && !serverInstance) {
    console.log('No active server or socket connections to close');
    cleanup();
    return;
  }
  
  // Notify all connected clients about the shutdown
  try {
    if (io) {
      io.sockets.emit('connection_status', {
        status: 'server_restart',
        message: 'The server is restarting. The page will automatically refresh soon.'
      });
      console.log('Notifying clients of shutdown...');
    }
  } catch (err) {
    console.error('Error notifying clients of shutdown:', err);
  }
  
  // Give clients time to process notification before closing sockets
  setTimeout(() => {
    // First close all socket connections
    if (io) {
      try {
        // Force close any remaining engine.io connections
        try {
          const engineIo = io.engine;
          // Close all engine.io connections
          if (engineIo && engineIo.clients) {
            Object.keys(engineIo.clients).forEach(id => {
              try {
                const client = engineIo.clients[id];
                if (client && client.close) {
                  client.close();
                }
              } catch (e) {
                console.error(`Error closing engine.io client ${id}:`, e);
              }
            });
          }
        } catch (engineErr) {
          console.error('Error closing engine.io connections:', engineErr);
        }
        
        io.close(() => {
          console.log('Socket connections closed');
          
          // Then close the HTTP server if it exists
          if (serverInstance) {
            serverInstance.close(() => {
              console.log('Server closed successfully');
              cleanup();
            });
            // In case .close() hangs, we want to force exit
            setTimeout(() => {
              console.log('Server close timed out, forcing shutdown');
              cleanup();
            }, 5000);
          } else {
            cleanup();
          }
        });
      } catch (err) {
        console.error('Error during socket shutdown:', err);
        cleanup();
      }
    } else if (serverInstance) {
      // Close just the server if no io
      serverInstance.close(() => {
        console.log('Server closed successfully');
        cleanup();
      });
      // In case .close() hangs, we want to force exit
      setTimeout(() => {
        console.log('Server close timed out, forcing shutdown');
        cleanup();
      }, 5000);
    } else {
      cleanup();
    }
  }, 1000);
}

// Add explicit body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve shared directory for constants
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Serve constants to client
app.get('/constants.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`const CONSTANTS = ${JSON.stringify(CONSTANTS)};`);
});

// Serve student page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/student.html'));
});

// Serve instructor page
app.get('/instructor', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/instructor.html'));
});

// Serve screen dashboard page
app.get('/screen', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/screen.html'));
});

// Set up Socket.IO event handlers
setupSocketEvents(io);

// Add global error handler middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error occurred');
});

// Start the server with port fallback and smart retry
let PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT;

// Try to detect if we're running under nodemon
const isNodemon = process.env.npm_lifecycle_script && 
                 process.env.npm_lifecycle_script.includes('nodemon');

const startServer = () => {
  try {
    serverInstance = server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Student view: http://localhost:${PORT}`);
      console.log(`Instructor view: http://localhost:${PORT}/instructor`);
      console.log(`Screen dashboard: http://localhost:${PORT}/screen`);
    });
    
    // Handle server errors
    serverInstance.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        PORT++;
        setTimeout(() => {
          if (serverInstance) serverInstance.close();
          bindServer();
        }, 1000);
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error(`Failed to start server on port ${PORT}:`, error);
    // If port is in use, try another port
    if (error.code === 'EADDRINUSE') {
      const newPort = PORT + 1;
      console.log(`Attempting to start on port ${newPort} instead...`);
      PORT = newPort;
      setTimeout(startServer, 1000);
    }
  }
};

function bindServer() {
  try {
    serverInstance = server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Student view: http://localhost:${PORT}`);
      console.log(`Instructor view: http://localhost:${PORT}/instructor`);
      console.log(`Screen dashboard: http://localhost:${PORT}/screen`);
    });
    
    // Handle server errors
    serverInstance.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        PORT++;
        setTimeout(() => {
          serverInstance.close();
          bindServer();
        }, 1000);
      } else {
        console.error('Server error:', error);
      }
    });
  } catch (error) {
    console.error(`Failed to start server on port ${PORT}:`, error);
    if (error.code === 'EADDRINUSE') {
      PORT++;
      console.log(`Attempting to start on port ${PORT} instead...`);
      setTimeout(bindServer, 1000);
    }
  }
}

// Schedule cleanup of stale player connections
const playerManager = require('./playerManager');

// Clean up stale connections periodically
const CLEANUP_INTERVAL = 1000 * 60 * 60; // Every hour
setInterval(() => {
  console.log('Running scheduled cleanup of stale connections');
  playerManager.cleanupStaleConnections();
}, CLEANUP_INTERVAL);

startServer(); 
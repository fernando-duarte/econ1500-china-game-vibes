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
  
  // Set a shutdown flag to prevent new connections
  if (io) {
    io.sockets.emit('connection_status', {
      status: 'server_restart',
      message: 'The server is restarting. Please wait...'
    });
  }
  
  if (serverInstance) {
    // Close all socket connections first
    if (io) {
      try {
        io.close(() => {
          console.log('Socket connections closed');
          
          // Then close the HTTP server
          serverInstance.close(() => {
            console.log('Server closed successfully');
            if (typeof callback === 'function') {
              callback();
            } else {
              process.exit(0);
            }
          });
        });
      } catch (err) {
        console.error('Error during socket shutdown:', err);
        if (typeof callback === 'function') {
          callback();
        } else {
          process.exit(1);
        }
      }
    } else {
      serverInstance.close(() => {
        console.log('Server closed successfully');
        if (typeof callback === 'function') {
          callback();
        } else {
          process.exit(0);
        }
      });
    }
    
    // Increased timeout for graceful shutdown
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      if (typeof callback === 'function') {
        callback();
      } else {
        process.exit(1);
      }
    }, 10000); // Increased from 2000ms to 10000ms for production
  } else {
    if (typeof callback === 'function') {
      callback();
    } else {
      process.exit(0);
    }
  }
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
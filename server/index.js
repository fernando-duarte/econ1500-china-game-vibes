require('dotenv').config();
// Add global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const { setupSocketEvents } = require('./events');
const CONSTANTS = require('../shared/constants');
const teamManager = require('./teamManager');

// Check if we're in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO with test-specific configurations
const io = isTestEnvironment
  ? new Server(server, {
    pingTimeout: 2000, // Reduced ping timeout for faster tests
    pingInterval: 2000, // Reduced ping interval for faster tests
    connectTimeout: 5000, // Reduced connection timeout
    transports: ['websocket'], // Use only websocket for faster tests
  })
  : new Server(server);

// Add explicit body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Serve shared directory for constants
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Serve constants to client
app.get('/constants.js', (req, res) => {
  res.set('Content-Type', CONSTANTS.CONTENT_TYPES.JAVASCRIPT);
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

// Load student list
const studentList = teamManager.loadStudentList();
console.log(`Loaded ${studentList.length} students at server startup`);

// Set up Socket.IO event handlers
setupSocketEvents(io);

// Add global error handler middleware with more detailed logging
app.use((err, req, res, _next) => {
  // eslint-disable-line no-unused-vars
  const errorId =
    Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  console.error(`Express error [${errorId}]:`, err);
  console.error(`Request path: ${req.path}, method: ${req.method}`);

  // In test environment, provide more detailed error information
  if (isTestEnvironment) {
    res.status(500).json({
      errorId,
      message: 'Server error occurred',
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } else {
    // In production, don't expose error details
    res.status(500).send('Server error occurred');
  }
});

// Add catch-all 404 handler with more information
app.use((req, res, _next) => {
  // eslint-disable-line no-unused-vars
  console.log(`404 Not Found: ${req.method} ${req.path}`);

  // In test environment, provide more information
  if (isTestEnvironment) {
    res.status(404).json({
      message: 'Not Found',
      path: req.path,
      method: req.method,
      availableRoutes: ['/', '/instructor', '/screen', '/constants.js'],
    });
  } else {
    res.status(404).send('Not Found');
  }
});

// Start the server
const PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT;
// Only start the server if not in test environment or if explicitly required
if (!isTestEnvironment || process.env.START_SERVER_IN_TEST) {
  server.listen(PORT, () => {
    // Get the actual port that was assigned (especially important when PORT=0)
    const address = server.address();
    const actualPort =
      address && typeof address === 'object' ? address.port : PORT;
    console.log(`Server running on port ${actualPort}`);

    // For test environments, write the port to a file for reliable port detection
    if (isTestEnvironment && process.env.PORT_FILE) {
      try {
        fs.writeFileSync(process.env.PORT_FILE, actualPort.toString(), 'utf8');
        console.log(
          `Test server port ${actualPort} written to ${process.env.PORT_FILE}`,
        );
      } catch (error) {
        console.error(`Failed to write port to file: ${error.message}`);
      }

      // Also log a special marker for backward compatibility
      console.log(`TEST_SERVER_PORT=${actualPort}`);
    } else {
      console.log(`Student view: http://localhost:${actualPort}`);
      console.log(`Instructor view: http://localhost:${actualPort}/instructor`);
      console.log(`Screen dashboard: http://localhost:${actualPort}/screen`);
    }
  });
}

// Add graceful shutdown handler
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
  console.log('Received shutdown signal, closing server...');

  // Set a timeout to force exit if shutdown takes too long
  const forceExitTimeout = setTimeout(() => {
    console.error('Forced exit after shutdown timeout');
    process.exit(1);
  }, 10000);

  // Close the server gracefully
  server.close(() => {
    console.log('Server closed successfully');
    clearTimeout(forceExitTimeout);
    process.exit(0);
  });
}

// Export for testing
module.exports = { app, server };

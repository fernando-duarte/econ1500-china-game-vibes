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
const { Server } = require('socket.io');
const { setupSocketEvents } = require('./events');
const CONSTANTS = require('../shared/constants');

// Check if we're in test environment
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO with test-specific configurations
const io = isTestEnvironment
  ? new Server(server, {
      pingTimeout: 2000, // Reduce ping timeout for faster tests
      pingInterval: 5000, // Reduce ping interval for faster tests
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

// Set up Socket.IO event handlers
setupSocketEvents(io);

// Add global error handler middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error occurred');
});

// Add catch-all 404 handler
app.use((req, res, next) => {
  res.status(404).send('Not Found');
});

// Start the server
const PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT;
// Only start the server if not in test environment or if explicitly required
if (!isTestEnvironment || process.env.START_SERVER_IN_TEST) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Only log URLs in non-test environment
    if (!isTestEnvironment) {
      console.log(`Student view: http://localhost:${PORT}`);
      console.log(`Instructor view: http://localhost:${PORT}/instructor`);
      console.log(`Screen dashboard: http://localhost:${PORT}/screen`);
    }
  });
}

// Export for testing
module.exports = { app, server }; 
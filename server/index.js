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
const sass = require('sass'); // Would need to be installed

// Create Express app
const app = express();
const server = http.createServer(app);

// Set up Socket.IO
const io = new Server(server);

// Add explicit body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '../client')));

// Add cache headers for CSS files
app.use('/css', (req, res, next) => {
  // Set cache for 1 week (604800 seconds)
  res.setHeader('Cache-Control', 'public, max-age=604800');
  next();
});

// Serve shared directory for constants
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Virtual CSS directory route handler
app.get('/css/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const scssFilePath = path.join(__dirname, '../client/scss', fileName.replace('.css', '.scss'));
  
  // Check if the SCSS file exists
  if (fs.existsSync(scssFilePath)) {
    try {
      // Compile SCSS to CSS
      const result = sass.compile(scssFilePath);
      
      // Send the compiled CSS
      res.set('Content-Type', 'text/css');
      res.send(result.css);
      console.log(`Compiled and served CSS for ${fileName}`);
    } catch (error) {
      console.error(`Error compiling SCSS for ${fileName}:`, error);
      res.status(500).send(`/* Error compiling SCSS: ${error.message} */`);
    }
  } else {
    console.error(`SCSS file not found: ${scssFilePath}`);
    res.status(404).send(`/* CSS file not found: ${fileName} */`);
  }
});

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

// Add global error handler middleware
app.use((err, req, res, _next) => {
  // eslint-disable-line no-unused-vars
  const errorId =
    Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  console.error(`Express error [${errorId}]:`, err);
  console.error(`Request path: ${req.path}, method: ${req.method}`);
  
  // Don't expose error details
  res.status(500).send('Server error occurred');
});

// Add catch-all 404 handler
app.use((req, res, _next) => {
  // eslint-disable-line no-unused-vars
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).send('Not Found');
});

// Start the server
const PORT = process.env.PORT || CONSTANTS.DEFAULT_PORT;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Student view: http://localhost:${PORT}`);
  console.log(`Instructor view: http://localhost:${PORT}/instructor`);
  console.log(`Screen dashboard: http://localhost:${PORT}/screen`);
});

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

// Export for future use
module.exports = { app, server };

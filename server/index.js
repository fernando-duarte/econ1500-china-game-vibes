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

// Serve student page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/student.html'));
});

// Serve instructor page
app.get('/instructor', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/instructor.html'));
});

// Set up Socket.IO event handlers
setupSocketEvents(io);

// Add global error handler middleware
app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).send('Server error occurred');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Student view: http://localhost:${PORT}`);
  console.log(`Instructor view: http://localhost:${PORT}/instructor`);
}); 
const express = require('express');
const path = require('path');
const fs = require('fs');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API routes for Solow model simulations
const solowRoutesPath = path.join(__dirname, './routes/solow.js');
if (fs.existsSync(solowRoutesPath)) {
  app.use('/api/solow', require('./routes/solow'));
} else {
  app.use('/api/solow', (req, res) => {
    return res.status(501).json({
      success: false, 
      message: 'Solow model API not implemented yet'
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; 
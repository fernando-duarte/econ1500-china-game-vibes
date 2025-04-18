const express = require('express');
const router = express.Router();
const solowController = require('../controllers/solowController');

// Get current parameters
router.get('/parameters', solowController.getParameters);

// Update parameters
router.post('/parameters', solowController.updateParameters);

// Run simulation
router.post('/simulate', solowController.runSimulation);

// Get simulation results
router.get('/results', solowController.getResults);

module.exports = router; 
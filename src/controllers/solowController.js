const SolowModel = require('../models/solowModel');

// Initialize the model with default parameters
let model = new SolowModel();

// Controller methods
module.exports = {
  // Get current parameters
  getParameters: (req, res) => {
    try {
      res.json({ success: true, parameters: model.getParameters() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Update parameters
  updateParameters: (req, res) => {
    try {
      const newParams = req.body;
      model.updateParameters(newParams);
      res.json({ success: true, parameters: model.getParameters() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Run simulation
  runSimulation: (req, res) => {
    try {
      const years = req.body.years || 50;
      const results = model.simulate(years);
      res.json({ success: true, results });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // Get results
  getResults: (req, res) => {
    try {
      res.json({ success: true, results: model.getResults() });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}; 
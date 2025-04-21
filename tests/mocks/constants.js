// Import the real constants to ensure we're using the exact same values
const realConstants = require('../../shared/constants');

// Export a deep copy of the real constants to avoid mutations affecting the original
module.exports = JSON.parse(JSON.stringify(realConstants));

const { createTestGame, createTestPlayer } = require('../factories');
const CONSTANTS = require('../../shared/constants');

module.exports = {
  createGame: jest.fn(() => createTestGame()),
  getGame: jest.fn((id) => id === 'game123' ? createTestGame({ id }) : null),
  updateGame: jest.fn(),
  addPlayer: jest.fn((gameId, player) => createTestPlayer({ ...player })),
  getPlayers: jest.fn((gameId) => []),
  getPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  removePlayer: jest.fn(),
  validateInvestment: jest.fn((investment, output) => {
    // Real validation logic to test edge cases
    if (isNaN(investment)) return 0;
    if (investment < 0) return 0;
    if (investment > output) return output;
    return investment;
  }),
  calculateNewCapital: jest.fn((capital, investment, depreciation = CONSTANTS.DEPRECIATION_RATE) => {
    // Real calculation logic
    return capital * (1 - depreciation) + investment;
  }),
  calculateOutput: jest.fn((capital, productivity = CONSTANTS.ALPHA) => {
    // Real calculation logic
    return Math.pow(capital, productivity);
  })
}; 
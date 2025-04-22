/**
 * Socket.IO Test Setup
 *
 * This file sets up the environment for Socket.IO tests.
 * It should be included in Jest's setupFilesAfterEnv configuration.
 */

// Import resource tracker
const { setupGlobalCleanup } = require('../utils/resource-tracker');

// Set up global cleanup hooks
setupGlobalCleanup();

// Increase Jest timeout for Socket.IO tests
jest.setTimeout(60000); // Increased timeout for all tests

// Enable Socket.IO debug logs in test environment
process.env.DEBUG = 'socket.io:*';

console.log('Socket.IO test setup complete');

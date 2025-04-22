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
jest.setTimeout(10000);

// Enable Socket.IO debug logs in test environment
process.env.DEBUG = 'socket.io:*';

console.log('Socket.IO test setup complete');

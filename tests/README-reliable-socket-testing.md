# Reliable Socket.IO Testing Guide

This guide explains how to make Socket.IO tests work reliably without mocks inside the Jest environment.

## Key Strategies

1. **Use Promises and async/await**
   - Convert callback-based code to Promises
   - Use async/await for cleaner test code
   - Handle timeouts properly with Promise.race

2. **Optimize Socket.IO Configuration**
   - Use websocket transport only
   - Reduce ping timeout and interval
   - Set appropriate connection timeout

3. **Implement Proper Event Handling**
   - Use once() instead of on() for one-time events
   - Implement timeout handling for events
   - Use Promise.race to handle event timeouts

4. **Improve Resource Management**
   - Track all resources (servers, clients, timers)
   - Implement proper cleanup in afterEach/afterAll
   - Use dedicated utility functions for cleanup

5. **Run Tests in Band**
   - Run tests one at a time to avoid port conflicts
   - Use a separate Jest configuration for Socket.IO tests

## Utilities Provided

This project includes several utilities to help with reliable Socket.IO testing:

1. **Socket Test Utilities** (`tests/utils/socket-test-utils.js`):
   - Helper functions for creating servers and clients
   - Functions for waiting for events with timeouts
   - Utilities for proper resource cleanup

2. **Reliable Socket Setup** (`tests/setup/reliable-socket-setup.js`):
   - Sets up the environment for reliable Socket.IO tests
   - Configures Jest timeout and debug logs
   - Enables real console logs for debugging

3. **Jest Socket Config** (`jest.socket.config.js`):
   - Dedicated Jest configuration for Socket.IO tests
   - Runs tests in band to avoid port conflicts
   - Disables coverage thresholds for Socket.IO tests

## Example Tests

1. **Reliable Socket Test** (`tests/integration/reliable-socket.test.js`):
   - Demonstrates how to make Socket.IO tests work reliably
   - Uses Promises and async/await for cleaner code
   - Implements proper event handling and timeouts

2. **Simplified Reliable Socket Test** (`tests/integration/simplified-reliable-socket.test.js`):
   - Simplified version using the socket-test-utils
   - Shows how to create a server and client in one step
   - Demonstrates how to test communication

3. **Socket Test** (`tests/integration/socket.test.js`):
   - Updated version of the original test
   - Uses the socket-test-utils for reliability
   - Demonstrates how to test Socket.IO events

## Running Tests

To run Socket.IO tests:

```bash
# Run Socket.IO tests with dedicated config
npx jest --config=jest.socket.config.js

# Run a specific test
npx jest --config=jest.socket.config.js tests/integration/simplified-reliable-socket.test.js

# Run with open handle detection
npx jest --config=jest.socket.config.js --detectOpenHandles
```

## Best Practices

1. **Use the Provided Utilities**:
   - Use createServerAndClient() for easy setup
   - Use waitForEvent() for reliable event handling
   - Use cleanupSocketResources() for proper cleanup

2. **Handle Timeouts Properly**:
   - Set appropriate timeouts for tests
   - Use Promise.race for event timeouts
   - Implement fallback cleanup for timeouts

3. **Run Tests in Band**:
   - Use the dedicated Jest config
   - Run tests one at a time
   - Avoid port conflicts

4. **Debug Effectively**:
   - Enable Socket.IO debug logs
   - Use real console logs
   - Check for connection errors

## Troubleshooting

If you encounter issues with Socket.IO tests:

1. **Connection Timeouts**:
   - Check Socket.IO configuration
   - Increase test timeout
   - Check for network issues

2. **Event Timeouts**:
   - Verify event names
   - Check event handler implementation
   - Increase event timeout

3. **Resource Cleanup Issues**:
   - Use the provided cleanup utilities
   - Check for unclosed resources
   - Run with --detectOpenHandles

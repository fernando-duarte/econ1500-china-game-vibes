# Socket.IO Testing Guide

This directory contains tests for the Socket.IO functionality in the application. We have implemented two approaches to Socket.IO testing:

1. **Mock-Based Testing**: Using mock Socket.IO objects to test business logic
2. **Reliable Real Connection Testing**: Using real Socket.IO connections with improved reliability

## Test Structure

- **Integration Tests**: Located in `tests/integration/`
  - `socket.test.js`: Main Socket.IO test using real connections
  - `reliable-socket.test.js`: Enhanced Socket.IO test with improved reliability
  - `simplified-reliable-socket.test.js`: Simplified version using the socket-test-utils
  - `ultra-minimal-socket.test.js`: Ultra-minimal test that doesn't rely on connection events
  - `server-events.test.js`: Tests for server event handlers using mocked Socket.IO objects
  - `mock-socket.test.js`: Example of mock-based testing

- **Utilities**: Located in `tests/utils/`
  - `socket-mock.js`: Utilities for mocking Socket.IO objects
  - `socket-test-utils.js`: Utilities for reliable Socket.IO testing
  - `resource-tracker.js`: Utilities for tracking and cleaning up resources

- **Setup**: Located in `tests/setup/`
  - `reliable-socket-setup.js`: Setup file for reliable Socket.IO tests
  - `socket-test-setup.js`: Setup file for Socket.IO tests

## Running Tests

To run Socket.IO tests:

```bash
# Run all tests
npm test

# Run Socket.IO tests with dedicated config
npx jest --config=jest.socket.config.js

# Run a specific test
npx jest --config=jest.socket.config.js tests/integration/socket.test.js

# Run with open handle detection
npx jest --config=jest.socket.config.js --detectOpenHandles
```

## Documentation

For more detailed information about Socket.IO testing, see:

- [Socket.IO Testing Recommendations](../docs/socket-io-testing-recommendations.md)
- [Socket.IO Investigation Results](../docs/socket-io-investigation-results.md)
- [Reliable Socket.IO Testing Guide](./README-reliable-socket-testing.md)

## Examples

For examples of different Socket.IO testing approaches, see the `examples/` directory.

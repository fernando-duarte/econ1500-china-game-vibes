# Socket.IO Testing Guide

This guide explains how to effectively test Socket.IO functionality in this project.

## Recommended Approaches

Based on our investigation, we recommend the following approaches for Socket.IO testing:

### 1. Mock Testing for Unit Tests

For unit tests, mock Socket.IO instead of trying to establish real connections:

```javascript
// Import the mock utility
const { createMockSocket } = require('../utils/socket-mock');

// Create a mock socket
const mockSocket = createMockSocket();

// Test function that uses Socket.IO
myFunction(mockSocket);

// Verify Socket.IO was used correctly
expect(mockSocket.emit).toHaveBeenCalledWith('event', data);
```

### 2. Ultra-Minimal Testing for Socket.IO Functionality

For testing Socket.IO itself, use the ultra-minimal approach:

```javascript
test('should create a Socket.IO server', () => {
  // Create Socket.IO server
  io = new Server(httpServer, {
    cors: { origin: '*' },
    transports: ['websocket']
  });
  
  // Verify server was created
  expect(io).toBeDefined();
});
```

### 3. Standalone Testing for Integration

For integration testing, use standalone Node.js scripts:

```bash
# Run the standalone test
node standalone-socket-test.js
```

## Utilities Provided

This project includes several utilities to help with Socket.IO testing:

1. **Socket Mock Utility** (`tests/utils/socket-mock.js`):
   - Provides mock Socket.IO objects for unit testing
   - Includes helper functions for triggering events

2. **Resource Tracker** (`tests/utils/resource-tracker.js`):
   - Tracks Socket.IO resources to ensure proper cleanup
   - Prevents memory leaks and open handles

3. **Test Setup** (`tests/setup/socket-test-setup.js`):
   - Sets up the environment for Socket.IO tests
   - Configures global cleanup hooks

4. **Standalone Test** (`standalone-socket-test.js`):
   - Tests Socket.IO outside of Jest
   - Useful for verifying basic connectivity

## Best Practices

1. **Use Mocks for Business Logic Tests**:
   - Focus on testing your application logic, not Socket.IO itself
   - Use mock sockets to verify that your code interacts with Socket.IO correctly

2. **Standardize Socket.IO Configuration**:
   - Use consistent configuration across all tests
   - Prefer websocket transport for tests
   - Example:
     ```javascript
     const io = new Server(httpServer, {
       cors: { origin: '*' },
       transports: ['websocket'],
       pingTimeout: 2000,
       pingInterval: 2000,
       connectTimeout: 5000
     });
     ```

3. **Track Resources**:
   - Use the resource tracker to ensure proper cleanup
   - Track all created resources (servers, clients, timers)
   - Example:
     ```javascript
     const { trackHttpServer, trackSocketServer } = require('../utils/resource-tracker');
     
     // Track resources
     const httpServer = trackHttpServer(http.createServer());
     const io = trackSocketServer(new Server(httpServer));
     ```

4. **Separate Socket.IO Testing from Business Logic**:
   - Test Socket.IO connection functionality separately
   - Test business logic with mocked Socket.IO objects

## Running Tests

To run Socket.IO tests:

```bash
# Run Jest tests with open handle detection
npm test -- --detectOpenHandles

# Run standalone test
node standalone-socket-test.js
```

## Troubleshooting

If you encounter issues with Socket.IO tests:

1. **Connection Timeouts**:
   - Check that you're using the websocket transport
   - Verify that the server is running on the expected port
   - Increase timeouts if necessary

2. **Open Handles**:
   - Use the resource tracker to ensure proper cleanup
   - Run tests with `--detectOpenHandles` to identify issues

3. **Test Failures**:
   - Check for errors in the console
   - Verify that Socket.IO is configured correctly
   - Try running the standalone test to isolate issues

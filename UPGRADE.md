# Express 5 Upgrade Notes

## Changes Made

### Dependencies
- Updated Express from 4.x to 5.0
- Kept Socket.IO at version 4.8.1

### Error Handling
- Added global process error handlers for uncaught exceptions and unhandled rejections
- Added a global Express error handler middleware
- Added try/catch blocks to all Socket.IO event handlers

### Body Parser
- Added explicit body parser middleware with appropriate settings:
  - `app.use(express.json())`
  - `app.use(express.urlencoded({ extended: false }))`

## Breaking Changes Addressed
- Made sure error handling was in place for promise rejections
- Updated body parser settings to account for Express 5 changes
- Secured all Socket.IO event handlers with proper error handling

## Potential Issues to Watch
- Path route matching syntax changes (none in our app)
- Status code validation (all used codes are standard HTTP codes)
- Body parser behavior changes (made explicit middleware settings)

## Testing
- Tested full game flow multiple times
- Verified error handling

## Node.js Compatibility
- Application now requires Node.js v18 or later (currently running on v22.14.0) 
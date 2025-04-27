// @ts-check
/// <reference path="./types.d.ts" />

import screenSocket from './socket/screenSocket.js';

// Attach to window object for compatibility with existing code
window.screenSocket = screenSocket;

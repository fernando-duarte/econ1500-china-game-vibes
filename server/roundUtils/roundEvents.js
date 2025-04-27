/**
 * Event emitter for round-related events.
 * This module breaks the circular dependency between startRound and endRound
 * by providing a central communication channel.
 */
const EventEmitter = require('events');

// Create a singleton event emitter
const roundEvents = new EventEmitter();

// Define event types as constants
const EVENTS = {
  ROUND_END: 'roundEnd',
  ROUND_START: 'roundStart',
};

module.exports = {
  roundEvents,
  EVENTS,
};

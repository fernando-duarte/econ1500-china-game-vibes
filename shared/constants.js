// Game configuration constants
const GAME_CONSTANTS = {
  // Round configuration
  ROUNDS: 10,
  ROUND_DURATION_SECONDS: 60,
  FIRST_ROUND_NUMBER: 1,
  MAX_PLAYERS: 50, // Maximum number of players allowed

  // Economic model constants
  INITIAL_CAPITAL: 100,
  ALPHA: 0.3,
  DEPRECIATION_RATE: 0.1,
  NEGATIVE_INITIAL_VALUE: -1, // Used as sentinel value for finding maximums

  // Display constants
  DECIMAL_PRECISION: 1,
  DISPLAY_INDEX_OFFSET: 1,
  TIMER_WARNING_THRESHOLD_SECONDS: 5, // When to show timer warning
  MAX_EVENT_LOG_SIZE: 50, // Maximum number of events in event log

  // Investment constants
  INVESTMENT_STEP: 0.1,
  INVESTMENT_MIN: 0,

  // Timing constants
  MILLISECONDS_PER_SECOND: 1000,
  AUTO_SUBMIT_THRESHOLD_SECONDS: 1,
  ALL_SUBMITTED_UI_DELAY_MS: 2000, // Delay before ending round after all players submitted (for UI updates)
  ALL_SUBMITTED_NOTIFICATION_SECONDS: 2, // How long to show all-submitted notification
  NOTIFICATION_DISPLAY_MS: 5000, // How long to show notifications
  STATUS_MESSAGE_DISPLAY_MS: 3000, // How long to show status messages
  SHORT_UI_DELAY_MS: 10, // Very short delay for UI repaints
  MEDIUM_UI_DELAY_MS: 50, // Medium delay for UI updates
  CSS_ANIMATION_DURATION_SECONDS: 0.5, // Duration for UI animations

  // UI Hacks
  REPAINT_HACK_OPACITY: '0.99', // Temporary opacity to force browser repaint

  // Auto-start feature
  AUTO_START_ENABLED: false,  // Disabled - use manual start instead
  AUTO_START_PLAYERS: 3,  // Default number of players needed if auto-start is enabled

  // Server defaults
  DEFAULT_PORT: 3000,

  // Game state constants
  GAME_STATES: {
    INACTIVE: 'inactive',
    WAITING: 'waiting',
    ACTIVE: 'active',
    COMPLETED: 'completed'
  },

  // Content type constants
  CONTENT_TYPES: {
    JAVASCRIPT: 'application/javascript'
  },

  // Environment constants
  ENVIRONMENT: {
    TYPEOF_UNDEFINED: 'undefined'
  },

  // CSS layout constant for stat-box width
  STAT_BOX_MIN_WIDTH: 150,

  // UI Text Constants
  UI_TEXT: {
    STATUS_ENABLED: 'Enabled',
    STATUS_DISABLED: 'Disabled',
    STATUS_ROUND_IN_PROGRESS: 'Round in progress',
    STATUS_GAME_OVER: 'Game over',
    STATUS_ALL_SUBMITTED_ENDING: 'All students submitted. Round ending...',
    STATUS_PLAYER_SUBMITTED: '✓ Submitted',
    STATUS_PLAYER_PENDING: 'Pending',
    TITLE_AUTO_SUBMITTED: 'Auto-submitted (current slider value)',
    AUTO_SUBMIT_SUFFIX: ' (auto)',
    PLACEHOLDER_INVESTMENT_SUBMITTED: 'No investments submitted yet',
    CONFIRM_FORCE_END: 'Are you sure you want to force end the game? This will end the current round and declare a winner immediately.',
    CONFIRM_START_GAME_PREFIX: 'Start the game with ',
    CONFIRM_START_GAME_SUFFIX: ' player(s)?',
    ALERT_NO_PLAYERS: 'No players have joined yet. Wait for at least one player to join before starting the game.'
  },

  // CSS Class Constants
  CSS: {
    HIDDEN: 'hidden',
    PLAYER_ITEM: 'player-item',
    PLAYER_SUBMITTED: 'player-submitted',
    PLAYER_AUTO_SUBMITTED: 'player-auto-submitted',
    AUTO_SUBMITTED_ROW: 'auto-submitted-row',
    ADMIN_NOTIFICATION: 'admin-notification',
    ADMIN_NOTIFICATION_PREFIX: 'admin-notification-',
    PLACEHOLDER_TEXT: 'placeholder-text',
    STATUS_MESSAGE: 'status-message',
    ALL_SUBMITTED_STATUS: 'all-submitted-status',
    PLAYER_NAME: 'player-name',
    PLAYER_STATUS: 'player-status',
    PLAYER_STATUS_PENDING: 'pending'
  },

  // Socket.IO Events
  SOCKET: {
    // Connection events
    EVENT_CONNECT: 'connect',
    EVENT_DISCONNECT: 'disconnect',
    EVENT_ERROR: 'error',

    // Game state events (server → client)
    EVENT_GAME_CREATED: 'game_created',
    EVENT_PLAYER_JOINED: 'player_joined',
    EVENT_GAME_STARTED: 'game_started',
    EVENT_ROUND_START: 'round_start',
    EVENT_INVESTMENT_RECEIVED: 'investment_received',
    EVENT_ALL_SUBMITTED: 'all_submitted',
    EVENT_ROUND_SUMMARY: 'round_summary',
    EVENT_ROUND_END: 'round_end',
    EVENT_GAME_OVER: 'game_over',
    EVENT_MANUAL_START_MODE: 'manual_start_mode',
    EVENT_ADMIN_NOTIFICATION: 'admin_notification',
    EVENT_TIMER_UPDATE: 'timer_update',
    EVENT_GAME_JOINED: 'game_joined',
    EVENT_STATE_SNAPSHOT: 'state_snapshot',

    // Control events (client → server)
    EVENT_FORCE_END_GAME: 'force_end_game',
    EVENT_SET_MANUAL_START: 'set_manual_start',
    EVENT_START_GAME: 'start_game',
    EVENT_SUBMIT_INVESTMENT: 'submit_investment',
    EVENT_JOIN_GAME: 'join_game'
  },

  // Notification Types
  NOTIFICATION: {
    TYPE_INFO: 'info',
    TYPE_WARNING: 'warning',
    TYPE_ERROR: 'error',
    DEFAULT_TYPE: 'info'
  },

  // HTTP Routes
  ROUTES: {
    ROOT: '/',
    INSTRUCTOR: '/instructor',
    STUDENT: '/',
    SCREEN: '/screen',
    SHARED: '/shared',
    CONSTANTS: '/constants.js'
  },

  // Table columns
  INVESTMENTS_TABLE_COLUMN_COUNT: 2
};

// Calculated constants (derived from the above)
const CALCULATED_CONSTANTS = {
  INITIAL_OUTPUT: Math.pow(GAME_CONSTANTS.INITIAL_CAPITAL, GAME_CONSTANTS.ALPHA).toFixed(GAME_CONSTANTS.DECIMAL_PRECISION),
};

const ALL_CONSTANTS = {
  ...GAME_CONSTANTS,
  ...CALCULATED_CONSTANTS
};

// Export for server-side use
if (typeof module !== GAME_CONSTANTS.ENVIRONMENT.TYPEOF_UNDEFINED && module.exports) {
  module.exports = {
    ...ALL_CONSTANTS
  };
}
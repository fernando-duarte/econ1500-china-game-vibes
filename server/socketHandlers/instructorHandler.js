// server/socketHandlers/instructorHandler.js

function handleStartGame(io, socket, gameLifecycle, roundManager, CONSTANTS) {
  console.log(
    `[Instructor Handler] Received ${CONSTANTS.SOCKET.EVENT_START_GAME} from ${socket.id}`
  );
  try {
    const result = gameLifecycle.startGame();
    if (result.success) {
      console.log('Game started by instructor');
      io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
        CONSTANTS.SOCKET.EVENT_GAME_STARTED
      );
      roundManager.startRound(io);
    } else {
      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, { message: result.error });
    }
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_START_GAME, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message: CONSTANTS.ERROR_MESSAGES.ERROR_STARTING_GAME,
    });
  }
}

function handleForceEndGame(io, socket, gameLifecycle, CONSTANTS) {
  try {
    console.log('Instructor requested force end game');
    const result = gameLifecycle.forceEndGame(io);
    if (!result.success) {
      socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
        message: result.error || CONSTANTS.ERROR_MESSAGES.ERROR_FORCE_END_GAME,
      });
    }
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_FORCE_END_GAME, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message: CONSTANTS.ERROR_MESSAGES.ERROR_PROCESSING_FORCE_END_GAME,
    });
  }
}

function handleSetManualStart(
  io,
  socket,
  gameLifecycle,
  CONSTANTS,
  game,
  enabled
) {
  try {
    console.log(
      `Instructor requested to ${enabled ? 'enable' : 'disable'} manual start mode`
    );
    const result = gameLifecycle.setManualStartMode(enabled);
    if (result.success) {
      console.log(`Manual start mode ${enabled ? 'enabled' : 'disabled'}`);
      io.to(CONSTANTS.SOCKET_ROOMS.ALL).emit(
        CONSTANTS.SOCKET.EVENT_MANUAL_START_MODE,
        { enabled: result.manualStartEnabled }
      );
      // Check auto-start only if disabling manual mode AND game not running
      if (!enabled && !game.isGameRunning) {
        console.log('Checking for auto-start after toggling to auto mode');
        gameLifecycle.checkAutoStart(io);
      }
    }
    // No need for an else block to emit error, setManualStartMode doesn't currently return errors in success=false case
  } catch (error) {
    console.error(CONSTANTS.DEBUG_MESSAGES.ERROR_IN_SET_MANUAL_START, error);
    socket.emit(CONSTANTS.SOCKET.EVENT_ERROR, {
      message: CONSTANTS.ERROR_MESSAGES.ERROR_SETTING_MANUAL_START,
    });
  }
}

function registerInstructorEventHandlers(
  io,
  socket,
  gameLifecycle,
  roundManager,
  CONSTANTS,
  game
) {
  socket.on(CONSTANTS.SOCKET.EVENT_START_GAME, () =>
    handleStartGame(io, socket, gameLifecycle, roundManager, CONSTANTS)
  );

  socket.on(CONSTANTS.SOCKET.EVENT_FORCE_END_GAME, () =>
    handleForceEndGame(io, socket, gameLifecycle, CONSTANTS)
  );

  socket.on(CONSTANTS.SOCKET.EVENT_SET_MANUAL_START, ({ enabled }) =>
    handleSetManualStart(io, socket, gameLifecycle, CONSTANTS, game, enabled)
  );
}

module.exports = { registerInstructorEventHandlers };

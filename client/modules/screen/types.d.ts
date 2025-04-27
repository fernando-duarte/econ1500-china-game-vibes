// Declaration file for global types used in screen modules

interface SocketUtilsInterface {
  logEvent(eventName: string, data?: any): void;
}

interface ScreenDOMInterface {
  elements: {
    gameStatus?: HTMLElement;
    roundNumber?: HTMLElement;
    timer?: HTMLElement;
    eventLog?: HTMLElement;
    playerList?: HTMLElement;
    playerCount?: HTMLElement;
    submissionCount?: HTMLElement;
    avgCapital?: HTMLElement;
    avgOutput?: HTMLElement;
    totalRounds?: HTMLElement;
    [key: string]: HTMLElement | undefined;
  };
  addEvent(eventType: string, message: string, highlight?: boolean): void;
  updatePlayerList(): void;
  updateAverages(): void;
}

interface ScreenGameInterface {
  addPlayer(playerName: string): void;
  updateGameState(state: string): void;
  resetForNewGame(): void;
  resetForNewRound(): void;
  recordInvestment(
    playerName: string,
    investment: number,
    isAutoSubmit: boolean
  ): void;
  updateCapitalAndOutput(results: any): void;
  startTimer(seconds: number): void;
  getState(): {
    timerInterval: number;
    players: string[];
    submittedPlayers: string[];
    autoSubmittedPlayers: string[];
    roundInvestments: Record<
      string,
      { investment: number; isAutoSubmit: boolean }
    >;
    capitalValues: any[];
    outputValues: any[];
    gameState: string;
    [key: string]: any;
  };
}

interface ScreenSocketInterface {
  socket: any;
  handlers: Record<string, Function>;
  init(): void;
  registerEventHandlers(): void;
}

interface ConstantsInterface {
  UI_TEXT: {
    STATUS_WAITING_FOR_PLAYERS: string;
    STATUS_GAME_STARTING: string;
    STATUS_ROUND_IN_PROGRESS: string;
    STATUS_ALL_SUBMITTED_ENDING: string;
    ROUND_COMPLETED_FORMAT: string;
    TIMER_PLACEHOLDER: string;
    STATUS_GAME_OVER: string;
    ERROR_PREFIX: string;
    STATUS_WAITING_FOR_GAME: string;
    TITLE_AUTO_SUBMITTED: string;
    [key: string]: string;
  };
  GAME_STATES: {
    WAITING: string;
    ACTIVE: string;
    COMPLETED: string;
    [key: string]: string;
  };
  FIRST_ROUND_NUMBER: number;
  ROUNDS: number;
  MAX_EVENT_LOG_SIZE: number;
  DECIMAL_PRECISION: number;
  CSS: {
    PLAYER_ITEM: string;
    PLAYER_SUBMITTED: string;
    PLAYER_AUTO_SUBMITTED: string;
    [key: string]: string;
  };
  SOCKET: {
    EVENT_CONNECT: string;
    EVENT_DISCONNECT: string;
    EVENT_PLAYER_JOINED: string;
    EVENT_PLAYER_DISCONNECTED: string;
    EVENT_GAME_CREATED: string;
    EVENT_GAME_STARTED: string;
    EVENT_ROUND_START: string;
    EVENT_INVESTMENT_RECEIVED: string;
    EVENT_ALL_SUBMITTED: string;
    EVENT_ROUND_SUMMARY: string;
    EVENT_GAME_OVER: string;
    EVENT_STATE_SNAPSHOT: string;
    EVENT_TIMER_UPDATE: string;
    EVENT_ERROR: string;
    EVENT_INSTRUCTOR_DISCONNECTED: string;
    [key: string]: string;
  };
  [key: string]: any;
}

// Extend existing types for DOM-related properties that TypeScript doesn't recognize
interface HTMLElement {
  textContent: string | number | null;
  innerHTML: string;
  children: HTMLCollection;
  insertBefore(newNode: Node, referenceNode: Node | null): Node;
  removeChild(child: Node): Node;
  appendChild(child: Node): Node;
  firstChild: Node | null;
  lastChild: Node | null;
  scrollTop: number;
}

// Socket.io client library
declare function io(url?: string, options?: any): any;

declare global {
  interface Window {
    screenDOM: ScreenDOMInterface;
    screenGame: ScreenGameInterface;
    screenSocket: ScreenSocketInterface;
    SocketUtils: SocketUtilsInterface;
    CONSTANTS: ConstantsInterface;
  }

  const SocketUtils: SocketUtilsInterface;
  const CONSTANTS: ConstantsInterface;
  const io: typeof io;
}

// This file needs to be treated as a module to make the global declarations work
export {};

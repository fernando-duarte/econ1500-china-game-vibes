/**
 * Global TypeScript definitions for Solow Game
 * This file provides type definitions for global objects that are attached to the window.
 */

// This export prevents TypeScript from treating this file as a script rather than a module
export {};

declare global {
  // Constants object used throughout the application
  var CONSTANTS: {
    SOCKET: Record<string, string>;
    CSS: Record<string, string>;
    UI_TEXT: Record<string, string>;
    FIRST_ROUND_NUMBER: number;
    DECIMAL_PRECISION: number;
    DISPLAY_INDEX_OFFSET: number;
    MEDIUM_UI_DELAY_MS: number;
    MILLISECONDS_PER_SECOND: number;
    NOTIFICATION: {
      DEFAULT_TYPE: string;
      [key: string]: string;
    };
    NOTIFICATION_DISPLAY_MS: number;
    ROUNDS: number;
    [key: string]: any;
  };

  // Socket.io instance
  var io: () => any;

  // SocketUtils helper for formatting and logging
  interface SocketUtilsInterface {
    formatNumber(value: number | string, precision?: number): string;
    logEvent(eventName: string, data?: any): void;
    updateElementText(element: HTMLElement, text: string | number): void;
    [key: string]: any;
  }
  var SocketUtils: SocketUtilsInterface;

  // Instructor modules
  interface InstructorDomInterface {
    elements: Record<string, HTMLElement & {
      checked?: boolean;
      disabled?: boolean;
      value?: string;
      placeholder?: string;
    }>;
    updatePlayerList(players: string[], submittedPlayers: string[], autoSubmittedPlayers: string[]): void;
    updateCurrentInvestmentsTable(investments: any[]): void;
    displayStatusMessage(message: string): void;
    [key: string]: any;
  }
  var InstructorDom: InstructorDomInterface;

  interface InstructorGameInterface {
    state: {
      players: string[];
      submittedPlayers: string[];
      autoSubmittedPlayers: string[];
      currentRoundInvestments: any[];
      [key: string]: any;
    };
    addPlayer(playerName: string): void;
    resetRoundState(): void;
    recordInvestment(playerName: string, investment: number, isAutoSubmit: boolean): void;
    areAllPlayersSubmitted(): boolean;
    [key: string]: any;
  }
  var InstructorGame: InstructorGameInterface;

  interface InstructorSocketInterface {
    socket: any;
    initializeSocketEvents(): void;
    [key: string]: any;
  }
  var InstructorSocket: InstructorSocketInterface;

  // Main modules
  interface InstructorMainInterface {
    [key: string]: any;
  }
  var InstructorMain: InstructorMainInterface;

  interface StudentMainInterface {
    [key: string]: any;
  }
  var StudentMain: StudentMainInterface;

  // Student modules
  interface StudentDomInterface {
    elements: Record<string, HTMLElement & {
      checked?: boolean;
      disabled?: boolean;
      value?: string;
      placeholder?: string;
      classList?: DOMTokenList;
    }>;
    [key: string]: any;
  }
  var StudentDom: StudentDomInterface;

  interface StudentGameInterface {
    [key: string]: any;
  }
  var StudentGame: StudentGameInterface;

  interface StudentSocketInterface {
    [key: string]: any;
  }
  var StudentSocket: StudentSocketInterface;

  // Screen modules
  interface ScreenDomInterface {
    [key: string]: any;
  }
  var ScreenDom: ScreenDomInterface;

  interface ScreenGameInterface {
    [key: string]: any;
  }
  var ScreenGame: ScreenGameInterface;

  interface ScreenSocketInterface {
    [key: string]: any;
  }
  var ScreenSocket: ScreenSocketInterface;

  // Extend Window interface to include our global variables
  interface Window {
    InstructorDom: InstructorDomInterface;
    InstructorGame: InstructorGameInterface;
    InstructorSocket: InstructorSocketInterface;
    InstructorMain: InstructorMainInterface;
    StudentDom: StudentDomInterface;
    StudentGame: StudentGameInterface;
    StudentSocket: StudentSocketInterface;
    StudentMain: StudentMainInterface;
    ScreenDom: ScreenDomInterface;
    ScreenGame: ScreenGameInterface;
    ScreenSocket: ScreenSocketInterface;
    SocketUtils: SocketUtilsInterface;
    CONSTANTS: typeof CONSTANTS;
    io: typeof io;
  }

  // Add Node interface extensions
  interface ParentNode {
    classList?: DOMTokenList;
  }
} 
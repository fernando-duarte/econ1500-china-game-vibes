/**
 * Global TypeScript declarations for the application
 */

// Extend the Window interface to include our global variables
interface Window {
  SELECTORS: typeof import('./selectors');
  StudentSocket?: any;
  InstructorSocket?: any;
  ScreenSocket?: any;
  CSSLoader?: any;
} 
/** @type {import('eslint').Linter.Config} */
module.exports = {
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'commonjs',
    globals: {
      // Custom globals used in the application
      CONSTANTS: true,
      io: true,
      InstructorDom: true,
      InstructorGame: true,
      InstructorSocket: true,
      StudentDom: true,
      StudentGame: true,
      StudentSocket: true,
      ScreenDom: true,
      ScreenGame: true,
      ScreenSocket: true,
      SocketUtils: true,
      // Common browser globals
      window: true,
      document: true,
      console: true,
      setTimeout: true,
      clearTimeout: true,
      setInterval: true,
      clearInterval: true,
      location: true,
      alert: true,
      confirm: true,
    }
  },
  linterOptions: {
    reportUnusedDisableDirectives: true,
  },
  // Custom rules
  rules: {
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  // What files to apply these settings to
  ignores: ['node_modules/**'],
}; 
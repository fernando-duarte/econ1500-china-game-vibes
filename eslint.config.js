// @ts-check
const defineConfig = require('eslint/config').defineConfig;

module.exports = defineConfig([
  {
    // Global ignores
    ignores: ['node_modules/**']
  },
  {
    // All JavaScript files
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        // Custom globals used in the application
        CONSTANTS: 'readonly',
        io: 'readonly',
        InstructorDom: 'readonly',
        InstructorGame: 'readonly',
        InstructorSocket: 'readonly',
        StudentDom: 'readonly',
        StudentGame: 'readonly',
        StudentSocket: 'readonly',
        ScreenDom: 'readonly',
        ScreenGame: 'readonly',
        ScreenSocket: 'readonly',
        SocketUtils: 'readonly',
        // Common browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        location: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
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
    }
  }
]); 
// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');

module.exports = defineConfig(
  // Global ignores
  globalIgnores(['node_modules/**']),

  // Include recommended rules as a base
  js.configs.recommended,

  // All JavaScript files
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        // Import standard globals
        ...globals.node,
        ...globals.browser,
        
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
  },
  
  // Server-side JavaScript files
  {
    files: ['server/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    }
  },
  
  // Client-side JavaScript files
  {
    files: ['client/**/*.js'],
    languageOptions: {
      sourceType: 'module',
    }
  }
); 
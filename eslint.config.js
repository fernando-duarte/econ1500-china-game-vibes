// @ts-check
const { defineConfig, globalIgnores } = require('eslint/config');
const js = require('@eslint/js');
const globals = require('globals');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig(
  // Global ignores
  globalIgnores(['node_modules/**']),

  // Include recommended rules as a base
  js.configs.recommended,

  // Add Prettier plugin and recommended config
  // This needs to come *after* js.configs.recommended and *before* any rule overrides
  // to ensure Prettier rules take precedence and disable conflicting ESLint rules.
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      ...prettierConfig.rules, // Disable conflicting ESLint rules
      'prettier/prettier': 'error', // Enable Prettier rule (as an ESLint error)
    },
  },

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
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    // Custom rules (Prettier handles formatting, so remove formatting rules)
    rules: {
      // indent: ['error', 2], // Handled by Prettier
      // 'linebreak-style': ['error', 'unix'], // Handled by Prettier
      // quotes: ['error', 'single'], // Handled by Prettier
      // semi: ['error', 'always'], // Handled by Prettier
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // Add max-lines rule to warn when files exceed 200 lines
      'max-lines': [
        'warn',
        {
          max: 200,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      // Add any other non-formatting rules here
    },
  },

  // Server-side JavaScript files
  {
    files: ['server/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },

  // Client-side JavaScript files
  {
    files: ['client/**/*.js'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
        CONSTANTS: 'readonly',
        io: 'readonly',
        SocketUtils: 'readonly',
        screenDOM: 'readonly',
        screenGame: 'readonly',
      },
    },
  }
);

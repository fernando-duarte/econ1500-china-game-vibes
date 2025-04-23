module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: "eslint:recommended",
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "single"],
    semi: ["error", "always"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
  globals: {
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
  },
};

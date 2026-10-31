module.exports = {
  root: true,
  // Route parsing through Babel so modern syntax (class instance fields) lints.
  parser: "@babel/eslint-parser",
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2021,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
    babelOptions: {
      presets: [["@babel/preset-react", { runtime: "classic" }]],
    },
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
  settings: {
    react: { version: "16.14" },
  },
  rules: {
    "react/prop-types": "off",
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
  },
};

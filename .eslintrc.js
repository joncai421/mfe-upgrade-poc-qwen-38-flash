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
  overrides: [
    {
      // Option B: mfe-app-1 runs React 19 with the automatic JSX runtime, so JSX
      // no longer needs `React` in scope and the React-16-era rules/settings that
      // assume the classic runtime must be switched off for these files.
      files: ["mfe-app-1/**/*.js", "mfe-app-1/**/*.jsx", "tests/unit/mfe-app-1/**/*.js"],
      parserOptions: {
        babelOptions: {
          presets: [["@babel/preset-react", { runtime: "automatic" }]],
        },
      },
      settings: {
        react: { version: "19.3" },
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/jsx-uses-react": "off",
      },
    },
  ],
};

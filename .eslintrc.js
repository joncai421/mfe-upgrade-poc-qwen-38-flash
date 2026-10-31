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
      // mfe-app-1 is the React 19 workspace: it compiles with the automatic JSX
      // runtime, so `React` must NOT be in scope for JSX. Those two rules encode the
      // classic runtime, and the version hint keeps react/recommended's checks honest.
      files: ["mfe-app-1/**/*.js", "mfe-app-1/**/*.jsx", "tests/unit/mfe-app-1/**/*.js"],
      parserOptions: {
        babelOptions: {
          presets: [["@babel/preset-react", { runtime: "automatic" }]],
        },
      },
      settings: {
        react: { version: "19" },
      },
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/jsx-uses-react": "off",
      },
    },
  ],
};

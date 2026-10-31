// Jest 30 / React 19 counterpart of tests/jest.setup.js.
// jest-dom v6 registers its matchers on plain import; the v5 `/extend-expect`
// entry point used by the React 16 project no longer exists.
require("@testing-library/jest-dom");

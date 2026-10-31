/**
 * Unit-test setup for the React 19 application (Option B).
 *
 * React 19 only allows `act(...)` when the environment declares itself an act
 * environment; without this flag React logs "The current testing environment is
 * not configured to support act(...)" whenever a root is rendered or unmounted
 * outside `act`. Tests that drive the mount contract directly (not through
 * React Testing Library) rely on this being set here.
 */
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jest-dom v6 matchers (the v5 `/extend-expect` entry point was removed).
require("@testing-library/jest-dom");

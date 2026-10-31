/**
 * Option B — expected runtime matrix (PRD 5.2 target version matrix).
 *
 * Used by the integration and E2E suites so "which React must be running where"
 * lives in exactly one place. The suites assert against values reported by the
 * applications AT RUNTIME (getRuntimeInfo / diagnostics), never against
 * package.json, so this table is the expectation and the browser is the evidence.
 */
const REACT16 = "16.14.0";
const REACT19 = "19.3.1";

const RUNTIME_MATRIX = {
  containerApp: {
    react: REACT16,
    reactDom: REACT16,
    shareScope: "react16",
    renderer: "react-dom:render",
    // The container is the reference instance, so "shares with container" is n/a.
    sharesWithContainer: null,
  },
  mfeApp1: {
    react: REACT19,
    reactDom: REACT19,
    shareScope: "react19",
    renderer: "react-dom/client:createRoot",
    // Different generation => a React instance of its own.
    sharesWithContainer: "no",
  },
  mfeApp2: {
    react: REACT16,
    reactDom: REACT16,
    shareScope: "react16",
    renderer: "react-dom:render",
    // Same generation => the react16 scope must hand out the container's copy.
    sharesWithContainer: "yes",
  },
  mfeApp3: {
    react: REACT16,
    reactDom: REACT16,
    shareScope: "react16",
    renderer: "react-dom:render",
    sharesWithContainer: "yes",
  },
};

const REMOTE_IDS = ["mfeApp1", "mfeApp2", "mfeApp3"];

module.exports = { REACT16, REACT19, RUNTIME_MATRIX, REMOTE_IDS };

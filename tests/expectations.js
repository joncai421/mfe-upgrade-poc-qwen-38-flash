/**
 * Option C target matrix (PRD 6.2) as one source of truth, so the integration and
 * E2E suites cannot drift apart: every browser assertion reads these values.
 *
 * Option C deliberately has NO named scopes: all four builds register and consume
 * inside webpack's "default" share scope, holding two React generations at once.
 */
const REACT_16_VERSION = "16.14.0";
const REACT_19_VERSION = "19.3.1";
const SHARE_SCOPE = "default";

const APPS = {
  containerApp: {
    workspace: "container-app",
    role: "container",
    port: 3000,
    react: REACT_16_VERSION,
    generation: 16,
    renderer: "legacy (ReactDOM.render)",
  },
  mfeApp1: {
    workspace: "mfe-app-1",
    role: "remote",
    port: 3001,
    tab: /App 1/,
    root: "app1-root",
    react: REACT_19_VERSION,
    generation: 19,
    renderer: "concurrent (createRoot)",
  },
  mfeApp2: {
    workspace: "mfe-app-2",
    role: "remote",
    port: 3002,
    tab: /App 2/,
    root: "app2-root",
    react: REACT_16_VERSION,
    generation: 16,
    renderer: "legacy (ReactDOM.render)",
  },
  mfeApp3: {
    workspace: "mfe-app-3",
    role: "remote",
    port: 3003,
    tab: /App 3/,
    root: "app3-root",
    react: REACT_16_VERSION,
    generation: 16,
    renderer: "legacy (ReactDOM.render)",
  },
};

const REACT_19_APPS = Object.keys(APPS).filter((id) => APPS[id].generation === 19);
const REACT_16_APPS = Object.keys(APPS).filter((id) => APPS[id].generation === 16);
const REMOTE_IDS = Object.keys(APPS).filter((id) => APPS[id].role === "remote");

module.exports = {
  REACT_16_VERSION,
  REACT_19_VERSION,
  SHARE_SCOPE,
  APPS,
  REACT_16_APPS,
  REACT_19_APPS,
  REMOTE_IDS,
};

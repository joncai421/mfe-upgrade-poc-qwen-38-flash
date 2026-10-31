const { createConfig, REACT16 } = require("../shared/webpack.base");

// Remote URLs come from .env (build-time injected); module aliases are stable.
//
// Option B: every remote is declared in the OBJECT form so the host can tell the
// Module Federation runtime which share scope each remote lives in. Loading a
// remote then initialises THAT scope (`__webpack_init_sharing__(shareScope)`)
// before the remote entry is consumed, instead of the default scope.
//   - mfeApp1 provides/consumes React 19  -> scope "react19"
//   - mfeApp2 / mfeApp3 use React 16       -> scope "react16"
const remotes = {
  mfeApp1: {
    external: `mfeApp1@${process.env.REMOTE_APP1_URL || "http://localhost:3001/remoteEntry.js"}`,
    shareScope: "react19",
  },
  mfeApp2: {
    external: `mfeApp2@${process.env.REMOTE_APP2_URL || "http://localhost:3002/remoteEntry.js"}`,
    shareScope: "react16",
  },
  mfeApp3: {
    external: `mfeApp3@${process.env.REMOTE_APP3_URL || "http://localhost:3003/remoteEntry.js"}`,
    shareScope: "react16",
  },
};

module.exports = createConfig({
  dir: __dirname,
  name: "containerApp",
  port: 3000,
  remotes,
  // The container's own React runtime is provided through the "react16" scope.
  react: REACT16,
});

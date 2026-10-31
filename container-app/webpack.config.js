const { createConfig, REACT_16_VERSION } = require("../shared/webpack.base");

// Remote URLs come from .env (build-time injected); module aliases are stable.
const remotes = {
  mfeApp1: `mfeApp1@${process.env.REMOTE_APP1_URL || "http://localhost:3001/remoteEntry.js"}`,
  mfeApp2: `mfeApp2@${process.env.REMOTE_APP2_URL || "http://localhost:3002/remoteEntry.js"}`,
  mfeApp3: `mfeApp3@${process.env.REMOTE_APP3_URL || "http://localhost:3003/remoteEntry.js"}`,
};

module.exports = createConfig({
  dir: __dirname,
  name: "containerApp",
  port: 3000,
  remotes,
  reactVersion: REACT_16_VERSION,
});

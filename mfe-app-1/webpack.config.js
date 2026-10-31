const { createConfig, REACT_19_VERSION } = require("../shared/webpack.base");

// Option C: this build provides/consumes React 19 inside the DEFAULT share scope.
module.exports = createConfig({
  dir: __dirname,
  name: "mfeApp1",
  port: 3001,
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/mount.js" },
  reactVersion: REACT_19_VERSION,
});

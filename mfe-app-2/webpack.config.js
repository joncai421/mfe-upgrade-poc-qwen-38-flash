const { createConfig, REACT16 } = require("../shared/webpack.base");

// Option B: remains on React 16.14.0 and shares that runtime with the container
// through the dedicated "react16" share scope.
module.exports = createConfig({
  dir: __dirname,
  name: "mfeApp2",
  port: 3002,
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/mount.js" },
  react: REACT16,
});

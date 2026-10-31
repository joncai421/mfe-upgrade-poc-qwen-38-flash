const { createConfig } = require("../shared/webpack.base");

module.exports = createConfig({
  dir: __dirname,
  name: "mfeApp2",
  port: 3002,
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/mount.js" },
});

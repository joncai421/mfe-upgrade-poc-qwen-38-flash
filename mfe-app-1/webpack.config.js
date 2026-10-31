const { createConfig } = require("../shared/webpack.base");

module.exports = createConfig({
  dir: __dirname,
  name: "mfeApp1",
  port: 3001,
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/mount.js" },
});

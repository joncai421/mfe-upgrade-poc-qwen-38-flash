const { createConfig } = require("../shared/webpack.base");

module.exports = createConfig({
  dir: __dirname,
  name: "mfeApp3",
  port: 3003,
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/mount.js" },
});

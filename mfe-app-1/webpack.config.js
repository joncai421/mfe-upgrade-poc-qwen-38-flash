const { createConfig, REACT19 } = require("../shared/webpack.base");

// Option B: this is the upgraded remote. Its React / React DOM (19.3.1) are
// provided and consumed exclusively through the "react19" share scope, so the
// React 16 runtime shared by the container, App 2 and App 3 can never be picked
// up here — `strictVersion: true` turns any such mismatch into a load-time error.
module.exports = createConfig({
  dir: __dirname,
  name: "mfeApp1",
  port: 3001,
  filename: "remoteEntry.js",
  exposes: { "./App": "./src/mount.js" },
  react: REACT19,
});

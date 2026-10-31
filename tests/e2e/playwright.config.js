const { defineConfig } = require("@playwright/test");
const servers = require("../servers");

// E2E suite: full container application in a real browser, driving the user
// journeys described in PRD 4.4 (navigation, per-app functionality, switching,
// unmount behaviour and console/network hygiene).
module.exports = defineConfig({
  testDir: __dirname,
  testMatch: "**/*.spec.js",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "off",
  },
  webServer: servers,
});

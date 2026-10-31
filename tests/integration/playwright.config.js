const { defineConfig } = require("@playwright/test");
const servers = require("../servers");

// Integration suite: verifies Module Federation mechanics and the framework-
// independent mount contract against real production builds in a real browser.
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

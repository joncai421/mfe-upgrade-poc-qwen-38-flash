// Shared Playwright webServer definitions: four static preview servers that
// serve each application's PRODUCTION build (dist). These exercise the real
// Webpack Module Federation runtime (remoteEntry.js + shared React), not mocks.
function server(workspace, port) {
  return {
    command: `npm run preview -w ${workspace}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: "ignore",
    stderr: "pipe",
  };
}

module.exports = [server("container-app", 3000), server("mfe-app-1", 3001), server("mfe-app-2", 3002), server("mfe-app-3", 3003)];

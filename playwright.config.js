const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run serve:test',
    stdout: 'ignore',
    stderr: 'pipe',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  reporter: [
    ['list'], // Keep the default list reporter
    ['playwright-testrail-reporter'] // Add TestRail reporter
  ],
});

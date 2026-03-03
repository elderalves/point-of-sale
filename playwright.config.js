require('dotenv').config();

const { defineConfig } = require('@playwright/test');

const hasTestRailConfig = [
  'TESTRAIL_HOST',
  'TESTRAIL_USERNAME',
  'TESTRAIL_PROJECT_ID',
  'TESTRAIL_SUITE_ID'
].every((key) => Boolean(process.env[key])) &&
  Boolean(process.env.TESTRAIL_API_KEY || process.env.TESTRAIL_PASSWORD);

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
    ...(hasTestRailConfig ? [['playwright-testrail-reporter']] : [])
  ],
});

require('dotenv').config();

const path = require('path');
const { defineConfig } = require('@playwright/test');

const resultsDir = path.join(__dirname, 'test-results');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: path.join(resultsDir, 'artifacts'),
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
    ['list'],
    ['html', { open: 'never' }],
    ['junit', {
      outputFile: path.join(resultsDir, 'junit-report.xml'),
      embedAnnotationsAsProperties: true
    }]
  ],
});

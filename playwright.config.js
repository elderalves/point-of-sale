require('dotenv').config();
const os = require('node:os');
const path = require('path');
const { defineConfig } = require('@playwright/test');

const resultsDir = path.join(__dirname, 'test-results');
const reportMode = process.env.PLAYWRIGHT_REPORT_MODE;

function getReporterConfig() {
  const junitReporter = ['junit', {
    outputFile: path.join(resultsDir, 'junit-report.xml'),
    embedAnnotationsAsProperties: true
  }];

  if (reportMode === 'allure') {
    return [
      ['list'],
      junitReporter,
      ['allure-playwright', {
        resultsDir: path.join(resultsDir, 'allure-results'),
        detail: true,
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          os_version: os.version(),
          node_version: process.version
        }
      }]
    ];
  }

  return [
    ['list'],
    ['html', {
      open: 'never',
      outputFolder: path.join(resultsDir, 'html-report')
    }],
    junitReporter
  ];
}

module.exports = defineConfig({
  testDir: './tests',
  outputDir: path.join(resultsDir, 'artifacts'),
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm run serve:test',
    stdout: 'ignore',
    stderr: 'pipe',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  reporter: getReporterConfig(),
});

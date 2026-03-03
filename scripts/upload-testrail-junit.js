require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function parseFieldList(value) {
  if (!value) {
    return [];
  }

  return value
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const junitPath = path.resolve(
  process.cwd(),
  process.env.TESTRAIL_JUNIT_PATH || 'test-results/junit-report.xml'
);
const password = process.env.TESTRAIL_API_KEY || process.env.TESTRAIL_PASSWORD;
const requiredVars = {
  TESTRAIL_HOST: process.env.TESTRAIL_HOST,
  TESTRAIL_USERNAME: process.env.TESTRAIL_USERNAME,
  TESTRAIL_PROJECT: process.env.TESTRAIL_PROJECT,
  TESTRAIL_API_KEY: password
};
const missing = Object.entries(requiredVars)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  const missingList = missing.map((key) => {
    return key === 'TESTRAIL_API_KEY' ? 'TESTRAIL_API_KEY or TESTRAIL_PASSWORD' : key;
  });

  console.error(`Missing required TestRail settings: ${missingList.join(', ')}`);
  process.exit(1);
}

if (!fs.existsSync(junitPath)) {
  console.error(`JUnit report not found at ${junitPath}`);
  process.exit(1);
}

const args = [
  '-y',
  '-h', process.env.TESTRAIL_HOST,
  '--project', process.env.TESTRAIL_PROJECT,
  '--username', process.env.TESTRAIL_USERNAME,
  '--password', password,
  'parse_junit',
  '--title', process.env.TESTRAIL_RUN_NAME || 'Playwright Automated Test Run',
  '-f', junitPath
];

parseFieldList(process.env.TESTRAIL_CASE_FIELDS).forEach((field) => {
  args.push('--case-fields', field);
});

parseFieldList(process.env.TESTRAIL_RESULT_FIELDS).forEach((field) => {
  args.push('--result-fields', field);
});

const result = spawnSync('trcli', args, { stdio: 'inherit' });

if (result.error && result.error.code === 'ENOENT') {
  console.error('TestRail CLI was not found. Install it with: pip install trcli');
  process.exit(1);
}

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status === null ? 1 : result.status);

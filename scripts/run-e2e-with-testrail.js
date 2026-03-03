const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const nodeBin = process.execPath;
const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const playwrightArgs = ['playwright', 'test'].concat(process.argv.slice(2));
const reportPath = path.resolve(
  process.cwd(),
  process.env.TESTRAIL_JUNIT_PATH || 'test-results/junit-report.xml'
);

const testRun = spawnSync(npxBin, playwrightArgs, { stdio: 'inherit' });

if (testRun.error) {
  console.error(testRun.error.message);
  process.exit(1);
}

const testExitCode = testRun.status === null ? 1 : testRun.status;

if (!fs.existsSync(reportPath)) {
  console.error(`JUnit report not found at ${reportPath}. Skipping TestRail upload.`);
  process.exit(testExitCode);
}

const uploadRun = spawnSync(nodeBin, [path.join(__dirname, 'upload-testrail-junit.js')], {
  stdio: 'inherit'
});
const uploadExitCode = uploadRun.status === null ? 1 : uploadRun.status;

if (testExitCode !== 0) {
  process.exit(testExitCode);
}

process.exit(uploadExitCode);

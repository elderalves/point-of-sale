const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  printArtifactSummary,
  runPlaywrightAndBuildArtifacts
} = require('./lib/run-playwright-and-build-artifacts');

const nodeBin = process.execPath;
const result = runPlaywrightAndBuildArtifacts(process.argv.slice(2));
const reportPath = path.resolve(
  process.cwd(),
  process.env.TESTRAIL_JUNIT_PATH || 'test-results/junit-report.xml'
);

printArtifactSummary(result);

if (!result.junitExists || !fs.existsSync(reportPath)) {
  if (result.testExitCode !== 0) {
    process.exit(result.testExitCode);
  }

  console.error(`JUnit report not found at ${reportPath}. Skipping TestRail upload.`);
  process.exit(1);
}

console.log('Uploading JUnit report to TestRail...');
const uploadRun = spawnSync(nodeBin, [path.join(__dirname, 'upload-testrail-junit.js')], {
  stdio: 'inherit'
});
const uploadExitCode = uploadRun.status === null ? 1 : uploadRun.status;

if (result.testExitCode !== 0) {
  process.exit(result.testExitCode);
}

if (result.pdfExitCode !== null && result.pdfExitCode !== 0) {
  process.exit(result.pdfExitCode);
}

process.exit(uploadExitCode);

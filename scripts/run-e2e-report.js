const {
  printArtifactSummary,
  runPlaywrightAndBuildArtifacts
} = require('./lib/run-playwright-and-build-artifacts');

const result = runPlaywrightAndBuildArtifacts(process.argv.slice(2));

printArtifactSummary(result);

if (result.testExitCode !== 0) {
  process.exit(result.testExitCode);
}

if (!result.junitExists) {
  process.exit(1);
}

if (result.pdfExitCode !== null && result.pdfExitCode !== 0) {
  process.exit(result.pdfExitCode);
}

process.exit(0);

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getAllureArtifactPaths() {
  const resultsDir = path.resolve(process.cwd(), 'test-results');
  const allureResultsDir = path.join(resultsDir, 'allure-results');
  const allureReportDir = path.join(resultsDir, 'allure-report');

  return {
    resultsDir,
    allureResultsDir,
    allureReportDir,
    allureReportPath: path.join(allureReportDir, 'index.html'),
    junitReportPath: path.join(resultsDir, 'junit-report.xml')
  };
}

function removeStaleArtifacts(paths) {
  [paths.allureResultsDir, paths.allureReportDir, paths.junitReportPath].forEach((targetPath) => {
    try {
      fs.rmSync(targetPath, { force: true, recursive: true });
    } catch (error) {
      // Ignore cleanup failures and let the current run surface real errors.
    }
  });
}

function hasAllureResults(resultsDir) {
  try {
    return fs.readdirSync(resultsDir).length > 0;
  } catch (error) {
    return false;
  }
}

function runPlaywrightWithAllure(cliArgs, paths) {
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['playwright', 'test'].concat(Array.isArray(cliArgs) ? cliArgs : []);

  return spawnSync(npxBin, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_REPORT_MODE: 'allure'
    }
  });
}

function buildAllureReport(paths) {
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

  return spawnSync(npxBin, ['allure', 'generate', path.basename(paths.allureResultsDir)], {
    stdio: 'inherit',
    cwd: paths.resultsDir
  });
}

function printArtifactSummary(paths, result) {
  console.log(`Allure raw results: ${paths.allureResultsDir}`);
  console.log(`Allure static report: ${paths.allureReportPath}`);

  if (result.junitExists) {
    console.log(`Playwright JUnit report: ${paths.junitReportPath}`);
  } else {
    console.log(`Playwright JUnit report: ${paths.junitReportPath} (not generated)`);
  }

  if (result.allureErrorMessage) {
    console.error(result.allureErrorMessage);
  }
}

function main() {
  const paths = getAllureArtifactPaths();
  const cliArgs = process.argv.slice(2);

  removeStaleArtifacts(paths);

  const testRun = runPlaywrightWithAllure(cliArgs, paths);
  const testExitCode = testRun.error ? 1 : (testRun.status === null ? 1 : testRun.status);
  const junitExists = fs.existsSync(paths.junitReportPath);

  if (testRun.error) {
    console.error(testRun.error.message);
  }

  if (!hasAllureResults(paths.allureResultsDir)) {
    const result = {
      junitExists,
      allureErrorMessage: `Allure results were not produced at ${paths.allureResultsDir}.`
    };

    printArtifactSummary(paths, result);

    if (testExitCode !== 0) {
      process.exit(testExitCode);
    }

    process.exit(1);
  }

  const allureRun = buildAllureReport(paths);
  const allureExitCode = allureRun.error ? 1 : (allureRun.status === null ? 1 : allureRun.status);
  const allureGenerated = allureExitCode === 0 && fs.existsSync(paths.allureReportPath);
  const result = {
    junitExists,
    allureGenerated,
    allureErrorMessage: null
  };

  if (allureRun.error) {
    result.allureErrorMessage = allureRun.error.message;
  } else if (!allureGenerated) {
    result.allureErrorMessage = `Allure report was not generated at ${paths.allureReportPath}.`;
  }

  printArtifactSummary(paths, result);

  if (testExitCode !== 0) {
    process.exit(testExitCode);
  }

  if (!allureGenerated) {
    process.exit(allureExitCode === 0 ? 1 : allureExitCode);
  }

  process.exit(0);
}

main();

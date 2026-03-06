const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function getArtifactPaths() {
  const resultsDir = path.resolve(process.cwd(), 'test-results');
  const htmlReportDir = path.join(resultsDir, 'html-report');

  return {
    resultsDir,
    htmlReportDir,
    htmlReportPath: path.join(htmlReportDir, 'index.html'),
    junitReportPath: path.join(resultsDir, 'junit-report.xml'),
    pdfReportPath: path.join(resultsDir, 'software-quality-assurance-report.pdf')
  };
}

function removeStaleArtifacts(paths) {
  [paths.htmlReportDir, paths.junitReportPath, paths.pdfReportPath].forEach((targetPath) => {
    try {
      fs.rmSync(targetPath, { force: true, recursive: true });
    } catch (error) {
      // Ignore cleanup failures and let the subsequent run surface real errors.
    }
  });
}

function runPlaywrightAndBuildArtifacts(cliArgs) {
  const args = Array.isArray(cliArgs) ? cliArgs : [];
  const paths = getArtifactPaths();
  const nodeBin = process.execPath;
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const playwrightArgs = ['playwright', 'test'].concat(args);
  const buildPdfScript = path.join(__dirname, '..', 'build-executive-pdf.js');

  removeStaleArtifacts(paths);

  const testRun = spawnSync(npxBin, playwrightArgs, { stdio: 'inherit' });

  if (testRun.error) {
    console.error(testRun.error.message);
    return {
      ...paths,
      testExitCode: 1,
      junitExists: fs.existsSync(paths.junitReportPath),
      pdfGenerated: false,
      pdfExitCode: null,
      pdfSkippedReason: 'Playwright did not start successfully.'
    };
  }

  const testExitCode = testRun.status === null ? 1 : testRun.status;
  const junitExists = fs.existsSync(paths.junitReportPath);

  if (!junitExists) {
    return {
      ...paths,
      testExitCode,
      junitExists,
      pdfGenerated: false,
      pdfExitCode: null,
      pdfSkippedReason: `JUnit report not found at ${paths.junitReportPath}. Skipping executive PDF generation.`
    };
  }

  const pdfRun = spawnSync(nodeBin, [buildPdfScript], { stdio: 'inherit' });
  let pdfExitCode = 1;

  if (pdfRun.error) {
    console.error(pdfRun.error.message);
  } else {
    pdfExitCode = pdfRun.status === null ? 1 : pdfRun.status;
  }

  return {
    ...paths,
    testExitCode,
    junitExists,
    pdfGenerated: pdfExitCode === 0 && fs.existsSync(paths.pdfReportPath),
    pdfExitCode,
    pdfSkippedReason: null
  };
}

function printArtifactSummary(result) {
  console.log(`Playwright HTML report: ${result.htmlReportPath}`);
  console.log(`Playwright JUnit report: ${result.junitReportPath}`);

  if (result.pdfGenerated) {
    console.log(`Executive PDF report: ${result.pdfReportPath}`);
    return;
  }

  if (result.pdfSkippedReason) {
    console.error(result.pdfSkippedReason);
    console.log(`Executive PDF report: ${result.pdfReportPath} (not generated)`);
    return;
  }

  console.log(`Executive PDF report: ${result.pdfReportPath} (generation failed)`);
}

module.exports = {
  getArtifactPaths,
  printArtifactSummary,
  runPlaywrightAndBuildArtifacts
};

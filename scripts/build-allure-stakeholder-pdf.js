const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const cwd = process.cwd();
const resultsDir = path.resolve(cwd, 'test-results');
const allureResultsDir = path.join(resultsDir, 'allure-results');
const allureReportDir = path.join(resultsDir, 'allure-report');
const allureSummaryPath = path.join(allureReportDir, 'summary.json');
const allureTreePath = path.join(allureReportDir, 'widgets', 'tree.json');
const allureHtmlReportPath = path.join(allureReportDir, 'index.html');
const outputPdfPath = path.join(resultsDir, 'allure-stakeholder-report.pdf');

function fail(message, error) {
  console.error(message);

  if (error) {
    console.error(error.stack || error.message || String(error));
  }

  process.exit(1);
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDuration(ms) {
  const durationMs = Math.max(0, toNumber(ms, 0));

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} s`;
  }

  return `${minutes}m ${seconds}s`;
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString();
  }

  return date.toLocaleString();
}

function relativePath(filePath) {
  return path.relative(cwd, filePath) || filePath;
}

function readJsonFile(filePath, required = false) {
  const exists = fs.existsSync(filePath);

  if (!exists) {
    if (required) {
      throw new Error(`Required file not found: ${filePath}`);
    }

    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
  }
}

function getLabelValue(labels, name) {
  const label = toArray(labels).find((entry) => entry && entry.name === name);
  return label && typeof label.value === 'string' ? label.value : '';
}

function collectStepAttachments(steps, output) {
  toArray(steps).forEach((step) => {
    toArray(step && step.attachments).forEach((attachment) => output.push(attachment));
    collectStepAttachments(step && step.steps, output);
  });
}

function collectAllAttachments(result) {
  const attachments = [];

  toArray(result.attachments).forEach((attachment) => attachments.push(attachment));
  collectStepAttachments(result.steps, attachments);

  return attachments
    .filter((attachment) => attachment && typeof attachment.source === 'string')
    .map((attachment) => {
      const absolutePath = path.join(allureResultsDir, attachment.source);

      return {
        name: attachment.name || '',
        source: attachment.source,
        type: attachment.type || '',
        absolutePath,
        relativePath: relativePath(absolutePath),
        exists: fs.existsSync(absolutePath)
      };
    });
}

function isImageAttachment(attachment) {
  if (!attachment) {
    return false;
  }

  const extension = path.extname(attachment.source || '').toLowerCase();
  const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp']);

  if (imageExtensions.has(extension)) {
    return true;
  }

  return String(attachment.type || '').startsWith('image/');
}

function inferMimeType(attachment) {
  const extension = path.extname(attachment.source || '').toLowerCase();
  const byExtension = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  };

  if (byExtension[extension]) {
    return byExtension[extension];
  }

  if (String(attachment.type || '').startsWith('image/')) {
    return attachment.type;
  }

  return null;
}

function createImageDataUri(attachment) {
  if (!attachment || !attachment.exists) {
    return null;
  }

  const mimeType = inferMimeType(attachment);

  if (!mimeType) {
    return null;
  }

  try {
    const content = fs.readFileSync(attachment.absolutePath);
    return `data:${mimeType};base64,${content.toString('base64')}`;
  } catch (error) {
    return null;
  }
}

function truncate(value, maxLength) {
  const text = String(value || '').trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

function getPreferredAttachment(attachments, predicate) {
  return attachments.find((attachment) => predicate(attachment)) || null;
}

function normalizeStatus(status) {
  const value = String(status || 'unknown').toLowerCase();

  if (['passed', 'failed', 'broken', 'skipped'].includes(value)) {
    return value;
  }

  return 'unknown';
}

function computeDurationMs(result) {
  const start = toNumber(result.start, NaN);
  const stop = toNumber(result.stop, NaN);

  if (Number.isFinite(start) && Number.isFinite(stop) && stop >= start) {
    return stop - start;
  }

  return toNumber(result.time, 0);
}

function buildTests(resultFiles) {
  return resultFiles.map((resultPath) => {
    const result = readJsonFile(resultPath, true);
    const attachments = collectAllAttachments(result);
    const status = normalizeStatus(result.status);
    const failureMessage = (result.statusDetails && result.statusDetails.message) || '';
    const traceText = (result.statusDetails && result.statusDetails.trace) || '';

    const screenshotAttachment = getPreferredAttachment(attachments, isImageAttachment);
    const traceAttachment = getPreferredAttachment(attachments, (attachment) => {
      const source = String(attachment.source || '').toLowerCase();
      const type = String(attachment.type || '').toLowerCase();
      return source.endsWith('.zip') || type.includes('trace');
    });
    const errorContextAttachment = getPreferredAttachment(attachments, (attachment) => {
      const source = String(attachment.source || '').toLowerCase();
      const type = String(attachment.type || '').toLowerCase();
      const name = String(attachment.name || '').toLowerCase();
      return source.endsWith('.md') || type.includes('markdown') || name.includes('error-context');
    });

    return {
      name: String(result.name || 'Unnamed test'),
      status,
      durationMs: computeDurationMs(result),
      suite: getLabelValue(result.labels, 'suite') || getLabelValue(result.labels, 'package') || 'Uncategorized',
      subSuite: getLabelValue(result.labels, 'subSuite') || 'General',
      fullName: String(result.fullName || ''),
      startedAt: toNumber(result.start, 0),
      failureMessage: truncate(failureMessage || traceText || 'Failure message unavailable.', 2000),
      traceExcerpt: truncate(traceText || failureMessage || '', 1400),
      screenshotAttachment,
      screenshotDataUri: createImageDataUri(screenshotAttachment),
      traceAttachment,
      errorContextAttachment
    };
  });
}

function buildTreeOrdering(treeData) {
  const ordering = new Map();

  if (!treeData || !treeData.leavesById) {
    return ordering;
  }

  Object.values(treeData.leavesById).forEach((leaf) => {
    if (!leaf || typeof leaf.name !== 'string' || ordering.has(leaf.name)) {
      return;
    }

    const order = Number.isFinite(leaf.groupOrder) ? leaf.groupOrder : ordering.size + 1;
    ordering.set(leaf.name, order);
  });

  return ordering;
}

function buildSuiteOverview(tests) {
  const suites = new Map();

  tests.forEach((test) => {
    const suiteKey = `${test.suite}:::${test.subSuite}`;
    const suiteName = test.subSuite && test.subSuite !== 'General'
      ? `${test.suite} / ${test.subSuite}`
      : test.suite;

    if (!suites.has(suiteKey)) {
      suites.set(suiteKey, {
        key: suiteKey,
        name: suiteName,
        total: 0,
        passed: 0,
        failed: 0,
        broken: 0,
        skipped: 0,
        durationMs: 0
      });
    }

    const summary = suites.get(suiteKey);
    summary.total += 1;
    summary.durationMs += test.durationMs;

    if (test.status === 'passed') summary.passed += 1;
    if (test.status === 'failed') summary.failed += 1;
    if (test.status === 'broken') summary.broken += 1;
    if (test.status === 'skipped') summary.skipped += 1;
  });

  return Array.from(suites.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function buildSummary(summaryJson, tests) {
  const derived = tests.reduce((acc, test) => {
    acc.total += 1;
    acc.durationMs += test.durationMs;

    if (test.status === 'passed') acc.passed += 1;
    if (test.status === 'failed') acc.failed += 1;
    if (test.status === 'broken') acc.broken += 1;
    if (test.status === 'skipped') acc.skipped += 1;

    return acc;
  }, {
    total: 0,
    passed: 0,
    failed: 0,
    broken: 0,
    skipped: 0,
    durationMs: 0
  });

  const summaryStats = (summaryJson && summaryJson.stats) || {};
  const failedCount = toNumber(summaryStats.failed, derived.failed + derived.broken);
  const total = toNumber(summaryStats.total, derived.total);
  const passed = toNumber(summaryStats.passed, derived.passed);
  const durationMs = toNumber(summaryJson && summaryJson.duration, derived.durationMs);
  const status = String((summaryJson && summaryJson.status) || ((failedCount > 0 || derived.broken > 0) ? 'failed' : 'passed')).toLowerCase();
  const createdAt = toNumber(summaryJson && summaryJson.createdAt, Date.now());
  const passRate = total > 0 ? ((passed / total) * 100) : 0;

  return {
    total,
    passed,
    failed: failedCount,
    broken: derived.broken,
    skipped: derived.skipped,
    durationMs,
    status,
    createdAt,
    passRate
  };
}

function renderSummaryNarrative(summary) {
  if (summary.status === 'passed' && summary.failed === 0 && summary.broken === 0) {
    return `The POS automation suite completed successfully with ${summary.passed} of ${summary.total} tests passing in ${formatDuration(summary.durationMs)}. No failed or broken scenarios were detected in this run.`;
  }

  return `The POS automation suite completed with outstanding issues: ${summary.passed} passed, ${summary.failed} failed, ${summary.broken} broken, and ${summary.skipped} skipped out of ${summary.total} tests in ${formatDuration(summary.durationMs)}. The failure details below highlight impacted scenarios and available diagnostics for follow-up.`;
}

function renderStatusBadge(status) {
  const normalized = status === 'passed' ? 'PASS' : 'FAIL';
  const className = status === 'passed' ? 'badge-pass' : 'badge-fail';
  return `<span class="badge ${className}">${normalized}</span>`;
}

function renderSuiteRows(suites) {
  return suites.map((suite) => (
    `<tr>
      <td>${escapeHtml(suite.name)}</td>
      <td>${suite.total}</td>
      <td>${suite.passed}</td>
      <td>${suite.failed + suite.broken}</td>
      <td>${suite.skipped}</td>
      <td>${escapeHtml(formatDuration(suite.durationMs))}</td>
    </tr>`
  )).join('\n');
}

function renderFailureCards(failures) {
  if (failures.length === 0) {
    return `<div class="empty-state">No failed or broken tests in this run.</div>`;
  }

  return failures.map((test) => {
    const screenshotBlock = test.screenshotDataUri
      ? `<div class="failure-image-wrap">
          <img class="failure-image" src="${test.screenshotDataUri}" alt="Failure screenshot for ${escapeHtml(test.name)}" />
        </div>`
      : `<div class="attachment-missing">Screenshot unavailable</div>`;

    const traceRef = test.traceAttachment
      ? escapeHtml(test.traceAttachment.relativePath)
      : 'Unavailable';
    const errorContextRef = test.errorContextAttachment
      ? escapeHtml(test.errorContextAttachment.relativePath)
      : 'Unavailable';

    return `<article class="failure-card">
      <div class="failure-header">
        <h3>${escapeHtml(test.name)}</h3>
        <span class="pill">${escapeHtml(test.status.toUpperCase())}</span>
      </div>
      <div class="failure-meta">
        <span><strong>Suite:</strong> ${escapeHtml(test.subSuite && test.subSuite !== 'General' ? `${test.suite} / ${test.subSuite}` : test.suite)}</span>
        <span><strong>Duration:</strong> ${escapeHtml(formatDuration(test.durationMs))}</span>
      </div>
      <pre class="failure-message">${escapeHtml(test.failureMessage)}</pre>
      ${test.traceExcerpt ? `<pre class="failure-trace">${escapeHtml(test.traceExcerpt)}</pre>` : ''}
      ${screenshotBlock}
      <div class="failure-attachments">
        <div><strong>Trace:</strong> ${traceRef}</div>
        <div><strong>Error context:</strong> ${errorContextRef}</div>
      </div>
    </article>`;
  }).join('\n');
}

function renderHtml(report) {
  const statusBadge = renderStatusBadge(report.summary.status);
  const suiteRows = renderSuiteRows(report.suites);
  const failureCards = renderFailureCards(report.failures);
  const narrative = renderSummaryNarrative(report.summary);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>POS Automation - Allure Stakeholder Report</title>
  <style>
    :root {
      --ink: #172136;
      --muted: #54627a;
      --line: #d9e0eb;
      --panel: #f6f8fc;
      --accent: #1f6feb;
      --pass: #15803d;
      --fail: #b42318;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      font-family: "Helvetica Neue", Arial, sans-serif;
      color: var(--ink);
      background: #fff;
      line-height: 1.45;
      font-size: 11px;
    }

    main {
      padding: 26px 28px;
    }

    section {
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 18px;
      margin: 0 0 16px;
      background: #fff;
      page-break-inside: avoid;
    }

    .cover {
      background: linear-gradient(135deg, #eef3ff 0%, #e8f9f2 100%);
      border-color: #cbd6eb;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 30px;
      line-height: 1.2;
      letter-spacing: 0.2px;
    }

    h2 {
      margin: 0 0 12px;
      font-size: 17px;
      line-height: 1.2;
    }

    h3 {
      margin: 0;
      font-size: 14px;
      line-height: 1.2;
    }

    .subtitle {
      font-size: 14px;
      color: var(--muted);
      margin: 0 0 12px;
    }

    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      margin: 10px 0 0;
      font-size: 10px;
    }

    .badge {
      display: inline-block;
      font-weight: 700;
      font-size: 11px;
      border-radius: 999px;
      padding: 5px 12px;
      letter-spacing: 0.5px;
    }

    .badge-pass {
      color: #fff;
      background: var(--pass);
    }

    .badge-fail {
      color: #fff;
      background: var(--fail);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }

    .kpi {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 10px;
      background: var(--panel);
    }

    .kpi .label {
      color: var(--muted);
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin: 0 0 4px;
    }

    .kpi .value {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }

    .artifact-list {
      margin: 10px 0 0;
      padding: 0;
      list-style: none;
      color: var(--muted);
      font-family: Menlo, Monaco, Consolas, monospace;
      font-size: 10px;
    }

    .artifact-list li {
      margin: 0 0 4px;
      overflow-wrap: anywhere;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    th, td {
      border-bottom: 1px solid var(--line);
      text-align: left;
      padding: 7px 6px;
      vertical-align: top;
    }

    th {
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      font-weight: 600;
      font-size: 9px;
    }

    .failure-card {
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 12px;
      margin: 0 0 12px;
      background: #fff;
      page-break-inside: avoid;
    }

    .failure-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin: 0 0 8px;
    }

    .pill {
      border: 1px solid #f2c1bd;
      background: #fff0ee;
      color: var(--fail);
      padding: 3px 8px;
      border-radius: 999px;
      font-size: 9px;
      font-weight: 700;
      white-space: nowrap;
    }

    .failure-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      color: var(--muted);
      font-size: 10px;
      margin: 0 0 8px;
    }

    .failure-message,
    .failure-trace {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      border: 1px solid var(--line);
      border-radius: 8px;
      margin: 0 0 8px;
      padding: 8px;
      background: #f8fafc;
      font-family: Menlo, Monaco, Consolas, monospace;
      font-size: 9px;
      max-height: 200px;
      overflow: hidden;
    }

    .failure-image-wrap {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 6px;
      background: #fff;
      margin: 0 0 8px;
    }

    .failure-image {
      display: block;
      width: 100%;
      max-height: 300px;
      object-fit: contain;
      border-radius: 4px;
    }

    .failure-attachments {
      font-size: 9px;
      color: var(--muted);
      line-height: 1.5;
      overflow-wrap: anywhere;
      font-family: Menlo, Monaco, Consolas, monospace;
    }

    .attachment-missing,
    .empty-state {
      border: 1px dashed var(--line);
      border-radius: 8px;
      padding: 10px;
      color: var(--muted);
      font-size: 10px;
      margin: 0 0 8px;
      background: #fafcff;
    }

    footer {
      margin-top: 16px;
      color: var(--muted);
      font-size: 10px;
      border-top: 1px solid var(--line);
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <main>
    <section class="cover">
      <h1>Software Quality Assurance Report</h1>
      <p class="subtitle">POS Automation - Allure Summary</p>
      <p>${statusBadge}</p>
      <div class="meta-row">
        <span><strong>Generated:</strong> ${escapeHtml(formatDate(report.summary.createdAt))}</span>
        <span><strong>Duration:</strong> ${escapeHtml(formatDuration(report.summary.durationMs))}</span>
        <span><strong>Total Tests:</strong> ${report.summary.total}</span>
      </div>
    </section>

    <section>
      <h2>Executive Summary</h2>
      <p>${escapeHtml(narrative)}</p>
    </section>

    <section>
      <h2>Metrics Overview</h2>
      <div class="kpi-grid">
        <article class="kpi"><p class="label">Total</p><p class="value">${report.summary.total}</p></article>
        <article class="kpi"><p class="label">Passed</p><p class="value">${report.summary.passed}</p></article>
        <article class="kpi"><p class="label">Failed</p><p class="value">${report.summary.failed + report.summary.broken}</p></article>
        <article class="kpi"><p class="label">Skipped</p><p class="value">${report.summary.skipped}</p></article>
        <article class="kpi"><p class="label">Pass Rate</p><p class="value">${report.summary.passRate.toFixed(1)}%</p></article>
        <article class="kpi"><p class="label">Runtime</p><p class="value">${escapeHtml(formatDuration(report.summary.durationMs))}</p></article>
      </div>
      <ul class="artifact-list">
        <li>${escapeHtml(relativePath(allureHtmlReportPath))}</li>
        <li>${escapeHtml(relativePath(allureResultsDir))}</li>
      </ul>
    </section>

    <section>
      <h2>Suite Overview</h2>
      <table>
        <thead>
          <tr>
            <th>Suite</th>
            <th>Total</th>
            <th>Passed</th>
            <th>Failed</th>
            <th>Skipped</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${suiteRows}
        </tbody>
      </table>
    </section>

    <section>
      <h2>Failure Details</h2>
      ${failureCards}
    </section>

    <footer>
      This PDF is a stakeholder summary generated from Allure artifacts.
      For interactive drill-down, use ${escapeHtml(relativePath(allureHtmlReportPath))}.
    </footer>
  </main>
</body>
</html>`;
}

function assertAllureInputs() {
  if (!fs.existsSync(allureResultsDir) || !fs.statSync(allureResultsDir).isDirectory()) {
    throw new Error(`Allure results directory not found at ${allureResultsDir}. Run "npm run test:e2e:allure" first.`);
  }
}

function getAllureResultFiles() {
  const entries = fs.readdirSync(allureResultsDir);
  const files = entries
    .filter((fileName) => fileName.endsWith('-result.json'))
    .map((fileName) => path.join(allureResultsDir, fileName))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No Allure test result files were found in ${allureResultsDir}.`);
  }

  return files;
}

function createReportModel() {
  assertAllureInputs();

  const summaryJson = readJsonFile(allureSummaryPath, false);
  const treeJson = readJsonFile(allureTreePath, false);
  const resultFiles = getAllureResultFiles();
  const tests = buildTests(resultFiles);
  const treeOrdering = buildTreeOrdering(treeJson);
  const suites = buildSuiteOverview(tests);
  const summary = buildSummary(summaryJson, tests);

  const failures = tests
    .filter((test) => test.status === 'failed' || test.status === 'broken')
    .sort((a, b) => {
      const orderA = treeOrdering.get(a.name);
      const orderB = treeOrdering.get(b.name);

      if (orderA !== undefined && orderB !== undefined) {
        return orderA - orderB;
      }

      if (orderA !== undefined) {
        return -1;
      }

      if (orderB !== undefined) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });

  return {
    summary,
    suites,
    failures
  };
}

async function generatePdf(reportModel) {
  await fs.promises.mkdir(resultsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const html = renderHtml(reportModel);

    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outputPdfPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const reportModel = createReportModel();
    await generatePdf(reportModel);
    console.log(`Allure stakeholder PDF generated at ${outputPdfPath}`);
  } catch (error) {
    fail('Failed to generate Allure stakeholder PDF.', error);
  }
}

main();

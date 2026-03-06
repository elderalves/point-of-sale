const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const cwd = process.cwd();
const resultsDir = path.resolve(cwd, 'test-results');
const junitReportPath = path.join(resultsDir, 'junit-report.xml');
const htmlReportPath = path.join(resultsDir, 'html-report', 'index.html');
const pdfReportPath = path.join(resultsDir, 'software-quality-assurance-report.pdf');
const defaultCommand = 'npm run test:e2e:report';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function toArray(value) {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function readFileIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

function createXmlParser() {
  try {
    const { XMLParser } = require('fast-xml-parser');

    return new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      trimValues: false,
      parseTagValue: false,
      cdataPropName: 'cdata',
      textNodeName: 'text'
    });
  } catch (error) {
    return null;
  }
}

function getNodeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => getNodeText(entry)).join('\n').trim();
  }

  if (typeof value === 'object') {
    return [value.cdata, value.text, value['#text']]
      .filter((entry) => entry !== undefined && entry !== null)
      .map((entry) => getNodeText(entry))
      .join('\n')
      .trim();
  }

  return String(value);
}

function extractAttachmentPaths(text, baseDir) {
  const value = String(text || '');
  const matches = [];
  const attachmentPattern = /\[\[ATTACHMENT\|([^\]]+)\]\]/g;
  const inlinePathPattern = /^\s*(\.\.?\/[^\n]+?\.(?:png|jpg|jpeg|zip|md))\s*$/gmi;
  let match = attachmentPattern.exec(value);

  while (match) {
    matches.push(path.resolve(baseDir, match[1]));
    match = attachmentPattern.exec(value);
  }

  match = inlinePathPattern.exec(value);

  while (match) {
    matches.push(path.resolve(baseDir, match[1]));
    match = inlinePathPattern.exec(value);
  }

  return matches;
}

function stripCdata(value) {
  const content = String(value || '').trim();
  const cdataMatch = content.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);

  if (cdataMatch) {
    return cdataMatch[1];
  }

  return content;
}

function parseAttributes(source) {
  const attributes = {};
  const pattern = /([A-Za-z0-9_:@-]+)="([\s\S]*?)"/g;
  let match = pattern.exec(source);

  while (match) {
    attributes[match[1]] = decodeXmlEntities(match[2]);
    match = pattern.exec(source);
  }

  return attributes;
}

function extractTagBlocks(xml, tagName) {
  const pattern = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'g');
  const blocks = [];
  let match = pattern.exec(xml);

  while (match) {
    blocks.push({
      attributes: parseAttributes(match[1]),
      content: match[2]
    });
    match = pattern.exec(xml);
  }

  return blocks;
}

function parseJUnitWithFallback(xml) {
  const rootBlock = extractTagBlocks(xml, 'testsuites')[0] || {
    attributes: {},
    content: xml
  };
  const suiteBlocks = extractTagBlocks(rootBlock.content, 'testsuite');

  return {
    summary: {
      tests: Number(rootBlock.attributes.tests || 0),
      failures: Number(rootBlock.attributes.failures || 0),
      skipped: Number(rootBlock.attributes.skipped || 0),
      errors: Number(rootBlock.attributes.errors || 0),
      time: Number(rootBlock.attributes.time || 0)
    },
    suites: suiteBlocks.map((suiteBlock) => {
      const caseBlocks = extractTagBlocks(suiteBlock.content, 'testcase');

      return {
        name: suiteBlock.attributes.name || 'Playwright Suite',
        timestamp: suiteBlock.attributes.timestamp || null,
        tests: Number(suiteBlock.attributes.tests || 0),
        failures: Number(suiteBlock.attributes.failures || 0),
        skipped: Number(suiteBlock.attributes.skipped || 0),
        errors: Number(suiteBlock.attributes.errors || 0),
        time: Number(suiteBlock.attributes.time || 0),
        cases: caseBlocks.map((caseBlock) => {
          const propertiesBlock = extractTagBlocks(caseBlock.content, 'properties')[0];
          const failureBlock = extractTagBlocks(caseBlock.content, 'failure')[0];
          const systemOutBlock = extractTagBlocks(caseBlock.content, 'system-out')[0];
          const properties = propertiesBlock
            ? extractTagBlocks(propertiesBlock.content, 'property').map((propertyBlock) => ({
              name: propertyBlock.attributes.name || '',
              value: propertyBlock.attributes.value || stripCdata(propertyBlock.content)
            }))
            : [];

          return {
            name: caseBlock.attributes.name || 'Unnamed Test',
            classname: caseBlock.attributes.classname || '',
            time: Number(caseBlock.attributes.time || 0),
            properties,
            failure: failureBlock
              ? {
                message: failureBlock.attributes.message || '',
                type: failureBlock.attributes.type || '',
                text: stripCdata(failureBlock.content)
              }
              : null,
            systemOut: systemOutBlock ? stripCdata(systemOutBlock.content) : ''
          };
        })
      };
    })
  };
}

function parseJUnitWithFastParser(xml) {
  const parser = createXmlParser();

  if (!parser) {
    return null;
  }

  const parsed = parser.parse(xml);
  const root = parsed.testsuites || {};
  const suites = toArray(root.testsuite);

  return {
    summary: {
      tests: Number(root.tests || 0),
      failures: Number(root.failures || 0),
      skipped: Number(root.skipped || 0),
      errors: Number(root.errors || 0),
      time: Number(root.time || 0)
    },
    suites: suites.map((suite) => {
      const cases = toArray(suite.testcase);

      return {
        name: suite.name || 'Playwright Suite',
        timestamp: suite.timestamp || null,
        tests: Number(suite.tests || 0),
        failures: Number(suite.failures || 0),
        skipped: Number(suite.skipped || 0),
        errors: Number(suite.errors || 0),
        time: Number(suite.time || 0),
        cases: cases.map((testCase) => ({
          name: testCase.name || 'Unnamed Test',
          classname: testCase.classname || '',
          time: Number(testCase.time || 0),
          properties: toArray(testCase.properties && testCase.properties.property).map((property) => ({
            name: property.name || '',
            value: property.value || getNodeText(property)
          })),
          failure: testCase.failure
            ? {
              message: testCase.failure.message || '',
              type: testCase.failure.type || '',
              text: getNodeText(testCase.failure)
            }
            : null,
          systemOut: getNodeText(testCase['system-out'])
        }))
      };
    })
  };
}

function parseJUnitXml(xml) {
  return parseJUnitWithFastParser(xml) || parseJUnitWithFallback(xml);
}

function normalizeSteps(properties) {
  const commentProperty = properties.find((property) => property.name === 'testrail_result_comment');

  if (!commentProperty || !commentProperty.value) {
    return [];
  }

  return String(commentProperty.value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, ''));
}

function getPropertyValue(properties, propertyName) {
  const property = properties.find((entry) => entry.name === propertyName);

  return property ? String(property.value || '') : '';
}

function existingFilePath(filePath) {
  if (!filePath) {
    return null;
  }

  try {
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function resolveAttachmentPaths(testCase) {
  const baseDir = path.dirname(junitReportPath);
  const failureText = testCase.failure ? testCase.failure.text : '';
  const candidates = [];
  const propertyAttachment = getPropertyValue(testCase.properties, 'testrail_attachment');

  if (propertyAttachment) {
    candidates.push(path.isAbsolute(propertyAttachment)
      ? propertyAttachment
      : path.resolve(baseDir, propertyAttachment));
  }

  extractAttachmentPaths(testCase.systemOut, baseDir).forEach((filePath) => candidates.push(filePath));
  extractAttachmentPaths(failureText, baseDir).forEach((filePath) => candidates.push(filePath));

  const unique = Array.from(new Set(candidates));
  const screenshots = [];
  let tracePath = null;

  unique.forEach((filePath) => {
    const existing = existingFilePath(filePath);

    if (!existing) {
      return;
    }

    if (/\.(png|jpg|jpeg)$/i.test(existing)) {
      screenshots.push(existing);
      return;
    }

    if (!tracePath && /\.zip$/i.test(existing)) {
      tracePath = existing;
    }
  });

  return {
    screenshotPath: screenshots[0] || null,
    tracePath
  };
}

function buildFailureExcerpt(failureText) {
  const cleaned = String(failureText || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim())
    .slice(0, 12)
    .join('\n')
    .trim();

  if (!cleaned) {
    return '';
  }

  if (cleaned.length <= 900) {
    return cleaned;
  }

  return `${cleaned.slice(0, 900).trim()}...\n\nSee HTML report for full details.`;
}

function normalizeReportData(parsed) {
  const suites = parsed.suites.map((suite) => {
    const normalizedCases = suite.cases.map((testCase) => {
      const failed = Boolean(testCase.failure);
      const skipped = /(?:\bskipped\b|\bpending\b)/i.test(testCase.name);
      const attachments = resolveAttachmentPaths(testCase);

      return {
        name: testCase.name,
        classname: testCase.classname,
        status: failed ? 'failed' : (skipped ? 'skipped' : 'passed'),
        durationSeconds: Number(testCase.time || 0),
        steps: normalizeSteps(testCase.properties),
        failureMessage: failed ? (testCase.failure.message || 'Test failed') : '',
        failureExcerpt: failed ? buildFailureExcerpt(testCase.failure.text || testCase.failure.message) : '',
        screenshotPath: attachments.screenshotPath,
        tracePath: attachments.tracePath
      };
    });

    return {
      name: suite.name,
      timestamp: suite.timestamp,
      tests: suite.tests || normalizedCases.length,
      failures: suite.failures || normalizedCases.filter((entry) => entry.status === 'failed').length,
      skipped: suite.skipped || normalizedCases.filter((entry) => entry.status === 'skipped').length,
      durationSeconds: Number(suite.time || 0),
      cases: normalizedCases
    };
  });

  const totalSuites = suites.length;
  const totalTests = suites.reduce((sum, suite) => sum + suite.cases.length, 0);
  const failed = suites.reduce((sum, suite) => {
    return sum + suite.cases.filter((entry) => entry.status === 'failed').length;
  }, 0);
  const skipped = suites.reduce((sum, suite) => {
    return sum + suite.cases.filter((entry) => entry.status === 'skipped').length;
  }, 0);
  const passed = Math.max(totalTests - failed - skipped, 0);
  const durationSeconds = Number(parsed.summary.time || 0) || suites.reduce((sum, suite) => {
    return sum + Number(suite.durationSeconds || 0);
  }, 0);
  const generatedAt = suites.find((suite) => suite.timestamp)?.timestamp || new Date().toISOString();
  const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : '0.0';

  return {
    summary: {
      title: 'Software Quality Assurance Report',
      generatedAt,
      status: failed > 0 ? 'failed' : 'passed',
      totalSuites,
      totalTests,
      passed,
      failed,
      skipped,
      durationSeconds,
      passRate
    },
    suites
  };
}

function formatDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function formatSeconds(value) {
  const amount = Number(value || 0);

  if (amount < 1) {
    return `${(amount * 1000).toFixed(0)} ms`;
  }

  return `${amount.toFixed(2)} s`;
}

function buildExecutiveSummary(summary) {
  if (summary.failed === 0) {
    return `This report summarizes the Point of Sale Playwright validation run. ${summary.totalTests} test${summary.totalTests === 1 ? '' : 's'} executed across ${summary.totalSuites} suite${summary.totalSuites === 1 ? '' : 's'}, and every test passed successfully. The run completed in ${formatSeconds(summary.durationSeconds)}, producing a ${summary.passRate}% pass rate with no failed cases.`;
  }

  return `This report summarizes the Point of Sale Playwright validation run. ${summary.totalTests} test${summary.totalTests === 1 ? '' : 's'} executed across ${summary.totalSuites} suite${summary.totalSuites === 1 ? '' : 's'}, and ${summary.failed} test${summary.failed === 1 ? '' : 's'} failed. The run completed in ${formatSeconds(summary.durationSeconds)} with a ${summary.passRate}% pass rate, so follow-up investigation is still required before the suite can be considered healthy.`;
}

function statusLabel(status) {
  return status === 'failed' ? 'Failed' : (status === 'skipped' ? 'Skipped' : 'Passed');
}

function relativeArtifactPath(filePath) {
  return path.relative(cwd, filePath) || filePath;
}

function toDataUri(filePath) {
  const existing = existingFilePath(filePath);

  if (!existing) {
    return null;
  }

  const extension = path.extname(existing).toLowerCase();
  const mimeType = extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png';
  const data = fs.readFileSync(existing);

  return `data:${mimeType};base64,${data.toString('base64')}`;
}

function renderSuiteCards(report) {
  if (report.suites.length === 0) {
    return '<p class="muted">No suite details were found in the JUnit report.</p>';
  }

  return report.suites.map((suite) => {
    const caseMarkup = suite.cases.map((testCase) => {
      const screenshotData = toDataUri(testCase.screenshotPath);
      const stepsMarkup = testCase.steps.length > 0
        ? `<ul class="steps">${testCase.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>`
        : '<p class="muted small">No step annotations were provided for this test.</p>';
      const failureMarkup = testCase.status === 'failed'
        ? `
          <div class="failure-block">
            <div class="failure-title">Failure Summary</div>
            <pre>${escapeHtml(testCase.failureExcerpt || testCase.failureMessage || 'The test failed without a detailed message.')}</pre>
            ${screenshotData
    ? `<div class="failure-image-wrap"><img class="failure-image" src="${screenshotData}" alt="Failure screenshot for ${escapeHtml(testCase.name)}"></div>`
    : '<p class="muted small">Screenshot unavailable.</p>'}
            <p class="artifact-ref"><strong>Trace:</strong> ${testCase.tracePath ? escapeHtml(relativeArtifactPath(testCase.tracePath)) : 'Unavailable'}</p>
            <p class="artifact-ref"><strong>Details:</strong> See the HTML report for the full error context and interactive trace.</p>
          </div>
        `
        : '';

      return `
        <div class="test-case">
          <div class="test-case-header">
            <div>
              <div class="test-name">${escapeHtml(testCase.name)}</div>
              <div class="test-meta">Duration: ${escapeHtml(formatSeconds(testCase.durationSeconds))}</div>
            </div>
            <span class="status-chip ${testCase.status}">${escapeHtml(statusLabel(testCase.status))}</span>
          </div>
          ${stepsMarkup}
          ${failureMarkup}
        </div>
      `;
    }).join('');

    return `
      <section class="page detailed-page">
        <div class="page-rule"></div>
        <h2>${escapeHtml(suite.name)}</h2>
        <div class="suite-metrics">
          <span>Tests: ${suite.tests}</span>
          <span>Failed: ${suite.failures}</span>
          <span>Skipped: ${suite.skipped}</span>
          <span>Duration: ${escapeHtml(formatSeconds(suite.durationSeconds))}</span>
        </div>
        ${caseMarkup}
      </section>
    `;
  }).join('');
}

function buildReportHtml(report) {
  const summary = report.summary;
  const executiveSummary = buildExecutiveSummary(summary);
  const statusClass = summary.status === 'failed' ? 'failed' : 'passed';
  const heroIllustration = `
    <svg viewBox="0 0 360 180" role="img" aria-label="Quality assurance illustration">
      <defs>
        <linearGradient id="heroBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e6f8ef" />
          <stop offset="100%" stop-color="#f5fbff" />
        </linearGradient>
        <linearGradient id="heroCheck" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#34c759" />
          <stop offset="100%" stop-color="#17924a" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="360" height="180" rx="24" fill="url(#heroBg)" />
      <circle cx="120" cy="78" r="22" fill="#eafff0" stroke="#34c759" stroke-width="4" />
      <circle cx="180" cy="64" r="28" fill="#eafff0" stroke="#34c759" stroke-width="5" />
      <circle cx="246" cy="94" r="18" fill="#eafff0" stroke="#34c759" stroke-width="4" />
      <path d="M100 78l12 12 22-28" fill="none" stroke="#34c759" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M162 64l15 15 30-38" fill="none" stroke="url(#heroCheck)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M237 94l9 9 17-22" fill="none" stroke="#34c759" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="70" cy="120" r="12" fill="#eafff0" stroke="#34c759" stroke-width="3" />
      <path d="M63 120l5 5 9-12" fill="none" stroke="#34c759" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="298" cy="56" r="10" fill="#eafff0" stroke="#34c759" stroke-width="3" />
      <path d="M292 56l4 4 8-10" fill="none" stroke="#34c759" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="82" cy="40" r="3" fill="#c8f0d6" />
      <circle cx="286" cy="122" r="3" fill="#c8f0d6" />
      <circle cx="56" cy="72" r="2.5" fill="#f94144" />
      <circle cx="264" cy="36" r="2.5" fill="#f94144" />
      <circle cx="302" cy="88" r="2.5" fill="#f94144" />
    </svg>
  `;

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(summary.title)}</title>
        <style>
          @page {
            size: Letter;
            margin: 0.55in;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            color: #1f2933;
            background: #ffffff;
            line-height: 1.45;
            font-size: 12px;
          }

          h1, h2, h3 {
            margin: 0;
            color: #0f172a;
          }

          h1 {
            font-size: 28px;
            line-height: 1.15;
            margin-top: 20px;
          }

          h2 {
            font-size: 20px;
            margin-bottom: 14px;
          }

          h3 {
            font-size: 14px;
            margin-bottom: 8px;
          }

          p {
            margin: 0 0 10px;
          }

          ul {
            margin: 0;
            padding-left: 18px;
          }

          li {
            margin-bottom: 4px;
          }

          pre {
            margin: 0;
            white-space: pre-wrap;
            word-break: break-word;
            font-family: Menlo, Monaco, Consolas, "Liberation Mono", monospace;
            font-size: 10px;
            line-height: 1.45;
          }

          .page {
            min-height: calc(11in - 1.1in);
            page-break-after: always;
            padding: 8px 0;
          }

          .page:last-child {
            page-break-after: auto;
          }

          .hero {
            background: linear-gradient(180deg, #f7fbff 0%, #edf7f1 100%);
            border: 1px solid #d8e7df;
            border-radius: 24px;
            padding: 28px;
          }

          .hero svg {
            display: block;
            width: 100%;
            max-width: 360px;
            margin: 0 auto;
          }

          .subhead {
            margin-top: 10px;
            color: #475569;
            font-size: 14px;
          }

          .status-badge {
            display: inline-block;
            margin-top: 14px;
            padding: 8px 14px;
            border-radius: 999px;
            color: #ffffff;
            font-weight: 700;
            font-size: 12px;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }

          .status-badge.passed {
            background: #1f9d55;
          }

          .status-badge.failed {
            background: #c62828;
          }

          .muted {
            color: #52606d;
          }

          .small {
            font-size: 11px;
          }

          .summary-card-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
            margin-top: 16px;
          }

          .summary-card {
            border: 1px solid #d9e2ec;
            border-radius: 16px;
            padding: 14px;
            background: #f8fafc;
          }

          .summary-card-label {
            display: block;
            font-size: 11px;
            color: #52606d;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .summary-card-value {
            font-size: 24px;
            font-weight: 700;
          }

          .section-copy {
            max-width: 6.9in;
            font-size: 13px;
          }

          .metrics-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          .metrics-table th,
          .metrics-table td {
            text-align: left;
            padding: 10px 12px;
            border-bottom: 1px solid #e5e7eb;
          }

          .metrics-table th {
            width: 36%;
            font-weight: 700;
            color: #334155;
          }

          .artifact-list {
            margin-top: 18px;
            padding: 14px 16px;
            border-radius: 16px;
            border: 1px solid #d9e2ec;
            background: #f8fafc;
          }

          .artifact-ref {
            margin-top: 8px;
            color: #334155;
            font-size: 11px;
            word-break: break-word;
          }

          .page-rule {
            height: 3px;
            width: 84px;
            background: linear-gradient(90deg, #16a34a 0%, #93c5fd 100%);
            border-radius: 999px;
            margin-bottom: 14px;
          }

          .suite-metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 18px;
            margin-bottom: 14px;
            color: #475569;
            font-size: 11px;
          }

          .test-case {
            border: 1px solid #d9e2ec;
            border-radius: 16px;
            padding: 14px;
            background: #ffffff;
            margin-bottom: 12px;
          }

          .test-case-header {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: flex-start;
            margin-bottom: 10px;
          }

          .test-name {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
          }

          .test-meta {
            color: #64748b;
            font-size: 11px;
          }

          .status-chip {
            display: inline-block;
            min-width: 72px;
            text-align: center;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }

          .status-chip.passed {
            background: #dcfce7;
            color: #166534;
          }

          .status-chip.failed {
            background: #fee2e2;
            color: #991b1b;
          }

          .status-chip.skipped {
            background: #fef3c7;
            color: #92400e;
          }

          .steps {
            margin-bottom: 10px;
          }

          .failure-block {
            margin-top: 8px;
            border-radius: 14px;
            padding: 12px;
            background: #fff7f7;
            border: 1px solid #fecaca;
          }

          .failure-title {
            font-weight: 700;
            color: #991b1b;
            margin-bottom: 8px;
          }

          .failure-image-wrap {
            margin-top: 10px;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 8px;
            background: #ffffff;
          }

          .failure-image {
            display: block;
            width: 100%;
            max-height: 280px;
            object-fit: contain;
            border-radius: 8px;
          }

          .appendix-card {
            border: 1px solid #d9e2ec;
            border-radius: 18px;
            padding: 18px;
            background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          }
        </style>
      </head>
      <body>
        <section class="page">
          <div class="hero">
            ${heroIllustration}
            <h1>${escapeHtml(summary.title)}</h1>
            <p class="subhead">Point of Sale Playwright Test Summary</p>
            <span class="status-badge ${statusClass}">${escapeHtml(statusLabel(summary.status))}</span>
            <p class="subhead">Generated: ${escapeHtml(formatDate(summary.generatedAt))}</p>
          </div>
        </section>

        <section class="page">
          <div class="page-rule"></div>
          <h2>Executive Summary</h2>
          <p class="section-copy">${escapeHtml(executiveSummary)}</p>
          <div class="summary-card-grid">
            <div class="summary-card">
              <span class="summary-card-label">Test Suites</span>
              <span class="summary-card-value">${summary.totalSuites}</span>
            </div>
            <div class="summary-card">
              <span class="summary-card-label">Total Tests</span>
              <span class="summary-card-value">${summary.totalTests}</span>
            </div>
            <div class="summary-card">
              <span class="summary-card-label">Pass Rate</span>
              <span class="summary-card-value">${escapeHtml(summary.passRate)}%</span>
            </div>
          </div>
        </section>

        <section class="page">
          <div class="page-rule"></div>
          <h2>Test Results Overview</h2>
          <table class="metrics-table">
            <tbody>
              <tr><th>Total Test Suites</th><td>${summary.totalSuites}</td></tr>
              <tr><th>Total Tests</th><td>${summary.totalTests}</td></tr>
              <tr><th>Passed</th><td>${summary.passed}</td></tr>
              <tr><th>Failed</th><td>${summary.failed}</td></tr>
              <tr><th>Skipped</th><td>${summary.skipped}</td></tr>
              <tr><th>Pass Rate</th><td>${escapeHtml(summary.passRate)}%</td></tr>
              <tr><th>Execution Time</th><td>${escapeHtml(formatSeconds(summary.durationSeconds))}</td></tr>
            </tbody>
          </table>
          <div class="artifact-list">
            <h3>Primary Artifacts</h3>
            <p class="artifact-ref"><strong>HTML report:</strong> ${escapeHtml(relativeArtifactPath(htmlReportPath))}</p>
            <p class="artifact-ref"><strong>JUnit XML:</strong> ${escapeHtml(relativeArtifactPath(junitReportPath))}</p>
            <p class="artifact-ref"><strong>Executive PDF:</strong> ${escapeHtml(relativeArtifactPath(pdfReportPath))}</p>
          </div>
        </section>

        ${renderSuiteCards(report)}

        <section class="page">
          <div class="page-rule"></div>
          <h2>Notes And Appendix</h2>
          <div class="appendix-card">
            <p>This document summarizes the current Point of Sale Playwright run using the generated JUnit artifact. It is intended for stakeholder review and release communication.</p>
            <p>The Playwright HTML report remains the engineering-grade artifact for debugging, trace inspection, and full failure context.</p>
            <p class="artifact-ref"><strong>Generated at:</strong> ${escapeHtml(formatDate(new Date().toISOString()))}</p>
            <p class="artifact-ref"><strong>Command:</strong> ${escapeHtml(defaultCommand)}</p>
          </div>
        </section>
      </body>
    </html>
  `;
}

async function writePdf(html) {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: pdfReportPath,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0.55in',
        right: '0.55in',
        bottom: '0.55in',
        left: '0.55in'
      }
    });
  } finally {
    await browser.close();
  }
}

async function main() {
  const xml = readFileIfExists(junitReportPath);

  if (!xml) {
    console.error(`JUnit report not found at ${junitReportPath}`);
    process.exit(1);
  }

  const parsed = parseJUnitXml(xml);
  const report = normalizeReportData(parsed);
  const html = buildReportHtml(report);

  await writePdf(html);
  console.log(`Executive PDF generated at ${pdfReportPath}`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});

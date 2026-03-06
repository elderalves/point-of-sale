const path = require('path');
const { mkdir } = require('fs/promises');

function addResultComment(testInfo, steps) {
  const lines = Array.isArray(steps) ? steps : [steps];
  const comment = lines
    .filter(Boolean)
    .map((line, index) => `${index + 1}. ${line}`)
    .join('\n');

  if (!comment) {
    return;
  }

  testInfo.annotations.push({
    type: 'testrail_result_comment',
    description: comment
  });
}

function addCaseField(testInfo, fieldName, value) {
  if (!fieldName || value === undefined || value === null || value === '') {
    return;
  }

  testInfo.annotations.push({
    type: 'testrail_case_field',
    description: `${fieldName}:${value}`
  });
}

async function attachFailureScreenshot(page, testInfo) {
  if (!page || testInfo.status === testInfo.expectedStatus) {
    return;
  }

  const screenshotDir = path.join(process.cwd(), 'test-results', 'screenshots');
  const slug = testInfo.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  const screenshotPath = path.join(
    screenshotDir,
    `${slug || 'playwright-test'}-${Date.now()}.png`
  );

  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ fullPage: true, path: screenshotPath });
  await testInfo.attach('failure-screenshot', {
    path: screenshotPath,
    contentType: 'image/png'
  });

  testInfo.annotations.push({
    type: 'testrail_attachment',
    description: screenshotPath
  });
}

module.exports = {
  addCaseField,
  addResultComment,
  attachFailureScreenshot
};

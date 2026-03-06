# Point of Sale

This is a **POS** app made on top of VUE.js


## Quickstart

``` sh
yarn
yarn serve
```

## Test Reporting

Playwright produces three report artifacts for the POS suite:

- Human-readable HTML report: `test-results/html-report/index.html`
- Machine-readable JUnit report: `test-results/junit-report.xml`
- Executive PDF report: `test-results/software-quality-assurance-report.pdf`

Failure diagnostics are written to:

- `test-results/screenshots/` for failure screenshots
- `test-results/artifacts/` for Playwright attachments, traces, and failure context

The executive PDF is the stakeholder-facing summary artifact. The built-in
Playwright HTML report remains the engineering-grade artifact for debugging and
full trace inspection. TestRail upload remains available as a separate workflow.
The legacy `playwright-testrail-reporter` is no longer used.

### Reporting workflows

1. Run `npm run test:e2e` for a raw local Playwright run.
2. Run `npm run test:e2e:report` to generate the HTML report, JUnit XML, and executive PDF locally.
3. Run `npm run test:e2e:testrail` to execute Playwright, generate the same local artifacts, and then upload the JUnit report to TestRail.

`npm run test:e2e:report` still attempts to generate the executive PDF when tests
fail, as long as `test-results/junit-report.xml` exists.

### Allure alternative

Run `npm run test:e2e:allure` for an alternative Allure 3 report path.

This workflow produces:

- Allure raw results: `test-results/allure-results/`
- Allure static report: `test-results/allure-report/index.html`

The existing `npm run test:e2e:report` workflow still produces the built-in
Playwright HTML report plus the executive PDF. TestRail upload still relies on
the JUnit XML artifact, not the Allure report.

### Allure stakeholder PDF

Run `npm run test:e2e:allure:pdf` to convert existing Allure artifacts into a
stakeholder-friendly PDF summary at:

- `test-results/allure-stakeholder-report.pdf`

This command does not rerun Playwright tests. It reads the current Allure
artifacts, so run `npm run test:e2e:allure` first to generate
`test-results/allure-results/` and `test-results/allure-report/`.

### TestRail upload details

1. Copy `.env.example` to `.env` and fill in your TestRail host, username, API key, and project name.
2. Install the TestRail CLI with `pip install trcli`.
3. Run `npm run test:e2e:testrail` to execute Playwright and upload the generated JUnit report.

Each test can enrich TestRail results with:

- `testrail_result_comment` annotations for step-by-step context
- `testrail_attachment` annotations for failure screenshots

If you only want to upload an existing JUnit report, run `npm run testrail:upload`.

### Runtime note

Playwright requires Node 18 or newer. In this workspace, validation has been
working with `mise exec node@20 -- npm run test:e2e:report` and
`mise exec node@20 -- npm run test:e2e:allure`.

The Allure CLI also requires Java 8 or newer. This repo installs Allure
locally, so prefer the npm scripts instead of a globally installed `allure`
binary.

## User Interface

<p align="center">
  <img src="resources/images/ui.jpg">
</p>

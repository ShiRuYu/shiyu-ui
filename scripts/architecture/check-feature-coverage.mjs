import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import ts from 'typescript';

const root = process.cwd();
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
const featureRoot = path.join(root, 'apps', 'web-naive', 'src', 'features');
const minimumLines = Number(process.env.FEATURE_COVERAGE_LINES ?? 90);
const minimumBranches = Number(process.env.FEATURE_COVERAGE_BRANCHES ?? 80);

if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found: ${summaryPath}`);
  console.error('Run `pnpm test:coverage` before checking feature thresholds.');
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const features = fs.existsSync(featureRoot)
  ? fs
      .readdirSync(featureRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .toSorted()
  : [];

// Report entries alone cannot distinguish an empty slice from omitted sources.
const logicFiles = (directory) =>
  fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return ['__tests__', 'tests', 'node_modules'].includes(entry.name)
        ? []
        : logicFiles(file);
    }
    if (
      !entry.isFile() ||
      /(?:\.d\.ts|\.(?:test|spec)\.[cm]?[jt]sx?)$/.test(entry.name)
    )
      return [];
    if (entry.name.endsWith('.vue')) return [file];
    if (!/\.[cm]?[jt]sx?$/.test(entry.name)) return [];
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
    );
    const hasRuntimeCode = source.statements.some(
      (statement) =>
        !(
          ts.isImportDeclaration(statement) ||
          ts.isExportDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement) ||
          ts.isTypeAliasDeclaration(statement) ||
          ts.isEmptyStatement(statement) ||
          statement.modifiers?.some(
            (modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword,
          )
        ),
    );
    return hasRuntimeCode ? [file] : [];
  });

const normalizedSummary = new Map(
  Object.entries(summary)
    .filter(([file]) => file !== 'total')
    .map(([file, metrics]) => [
      path.resolve(root, file).replaceAll('\\', '/'),
      metrics,
    ]),
);

const validMetrics = (metrics) =>
  ['lines', 'branches'].every((metric) => {
    const value = metrics?.[metric];
    return (
      Number.isSafeInteger(value?.total) &&
      value.total >= 0 &&
      Number.isSafeInteger(value?.covered) &&
      value.covered >= 0 &&
      value.covered <= value.total
    );
  });

const aggregate = (files) => {
  const totals = {
    lines: { total: 0, covered: 0 },
    branches: { total: 0, covered: 0 },
  };
  for (const file of files) {
    for (const metric of ['lines', 'branches']) {
      totals[metric].total += file[metric]?.total ?? 0;
      totals[metric].covered += file[metric]?.covered ?? 0;
    }
  }
  return totals;
};

const rows = [];
let failed = false;
if (features.length === 0) {
  console.error(`No feature directories found: ${featureRoot}`);
  failed = true;
}
for (const feature of features) {
  const expected = logicFiles(path.join(featureRoot, feature));
  const missing = expected.filter(
    (file) => !validMetrics(normalizedSummary.get(file.replaceAll('\\', '/'))),
  );
  for (const file of missing)
    console.error(
      `Missing or invalid coverage for source: ${path.relative(root, file)}`,
    );
  const files = expected
    .map((file) => normalizedSummary.get(file.replaceAll('\\', '/')))
    .filter(validMetrics);
  const totals = aggregate(files);
  const lines = totals.lines.total
    ? (totals.lines.covered / totals.lines.total) * 100
    : 0;
  // A file without conditional branches is fully covered for the branch
  // dimension; V8 reports that denominator as zero.
  const branches = totals.branches.total
    ? (totals.branches.covered / totals.branches.total) * 100
    : 100;
  const pass =
    missing.length === 0 &&
    (expected.length === 0 ||
      (lines >= minimumLines && branches >= minimumBranches));
  failed ||= !pass;
  rows.push({
    feature,
    files: files.length,
    expected: expected.length,
    lines,
    branches,
    pass,
  });
}

console.log(
  `Feature coverage thresholds: lines >= ${minimumLines}%, branches >= ${minimumBranches}%`,
);
for (const row of rows) {
  const note = row.expected === 0 ? ' (no logic files; skipped)' : '';
  console.log(
    `${row.pass ? 'PASS' : 'FAIL'} ${row.feature.padEnd(14)} files=${String(row.files).padStart(3)} lines=${row.lines.toFixed(2).padStart(6)}% branches=${row.branches.toFixed(2).padStart(6)}%${note}`,
  );
}

if (failed) {
  console.error(
    'Feature coverage gate failed. Add tests or explicitly adjust the threshold for a migration stage.',
  );
  process.exit(1);
}

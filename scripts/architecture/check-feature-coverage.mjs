import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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
for (const feature of features) {
  const prefix = `${path.join(featureRoot, feature)}${path.sep}`.replaceAll(
    '\\',
    '/',
  );
  const files = Object.entries(summary)
    .filter(
      ([file]) =>
        file !== 'total' && file.replaceAll('\\', '/').startsWith(prefix),
    )
    .map(([, metrics]) => metrics);
  const totals = aggregate(files);
  const lines = totals.lines.total
    ? (totals.lines.covered / totals.lines.total) * 100
    : 0;
  // A file without conditional branches is fully covered for the branch
  // dimension; V8 reports that denominator as zero.
  const branches = totals.branches.total
    ? (totals.branches.covered / totals.branches.total) * 100
    : 100;
  // A bounded context may not expose client-side logic yet (for example the
  // Memory slice). That is an explicit empty slice, not an untested one.
  const pass =
    files.length === 0 ||
    (lines >= minimumLines && branches >= minimumBranches);
  failed ||= !pass;
  rows.push({ feature, files: files.length, lines, branches, pass });
}

console.log(
  `Feature coverage thresholds: lines >= ${minimumLines}%, branches >= ${minimumBranches}%`,
);
for (const row of rows) {
  const note = row.files === 0 ? ' (no logic files; skipped)' : '';
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

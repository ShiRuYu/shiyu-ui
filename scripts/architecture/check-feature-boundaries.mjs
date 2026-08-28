import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SOURCE_FILE_PATTERN = /\.(?:ts|tsx|vue)$/;
const IMPORT_PATTERN =
  /(?:import|export)\s+(?:type\s+)?(?:[^'";]*?\s+from\s+)?["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

function normalize(value) {
  return value.replaceAll('\\', '/');
}

function sourceLocation(filePath) {
  const normalized = normalize(filePath);
  const marker = '/apps/web-naive/src/';
  const index = normalized.lastIndexOf(marker);
  return index !== -1
    ? normalized.slice(index + marker.length)
    : normalized.replace(/^apps\/web-naive\/src\//, '');
}

function featureImport(specifier) {
  const match = specifier.match(/^#\/features\/([^/]+)(?:\/(.+))?$/);
  return match ? { domain: match[1], deepPath: match[2] } : undefined;
}

function violation(rule, file, specifier) {
  return { file, rule, specifier };
}

export function findBoundaryViolations(filePath, source) {
  const location = sourceLocation(filePath);
  const [slice, domain] = location.split('/');
  const violations = [];

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const specifier = match[1] ?? match[2];

    if (
      specifier === '#/views' ||
      specifier.startsWith('#/views/') ||
      specifier === '../views' ||
      specifier.startsWith('../views/')
    ) {
      violations.push(violation('legacy-view-import', location, specifier));
      continue;
    }

    if (
      (specifier === '#/api' || specifier.startsWith('#/api/')) &&
      slice !== 'api'
    ) {
      violations.push(violation('legacy-api-import', location, specifier));
      continue;
    }

    const importedFeature = featureImport(specifier);
    if (!importedFeature) continue;

    if (slice === 'shared') {
      violations.push(
        violation('shared-no-feature-dependency', location, specifier),
      );
      continue;
    }

    if (slice === 'app' && importedFeature.deepPath) {
      violations.push(
        violation('app-feature-public-entry', location, specifier),
      );
      continue;
    }

    if (
      slice === 'features' &&
      domain !== importedFeature.domain &&
      importedFeature.deepPath
    ) {
      violations.push(violation('feature-public-entry', location, specifier));
    }
  }

  return violations;
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sourceFiles(entryPath)));
    } else if (SOURCE_FILE_PATTERN.test(entry.name)) {
      files.push(entryPath);
    }
  }
  return files;
}

export async function checkFeatureBoundaries(
  sourceRoot = path.resolve('apps/web-naive/src'),
) {
  const violations = [];
  try {
    await readdir(path.join(sourceRoot, 'views'));
    violations.push(violation('legacy-views-directory', 'views', 'src/views'));
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const file of await sourceFiles(sourceRoot)) {
    violations.push(
      ...findBoundaryViolations(file, await readFile(file, 'utf8')),
    );
  }
  return violations;
}

async function main() {
  const violations = await checkFeatureBoundaries();
  if (violations.length === 0) {
    console.log('Feature Slice boundaries are valid.');
    return;
  }

  for (const item of violations) {
    console.error(
      `${item.file}: ${item.rule} forbids import '${item.specifier}'`,
    );
  }
  process.exitCode = 1;
}

if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url
) {
  await main();
}

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const uiRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const backendRoot = process.env.SHIYU_BACKEND_ROOT
  ? path.resolve(process.env.SHIYU_BACKEND_ROOT)
  : path.resolve(uiRoot, '../shiyu-ai');
const navigationFiles = [
  path.join(
    backendRoot,
    'domains/iam/iam-implementation/src/main/resources/db/baseline/h2/seed/iam/02_auth.sql',
  ),
  path.join(
    backendRoot,
    'domains/iam/iam-implementation/src/main/resources/db/baseline/h2/seed/iam/05_navigation.sql',
  ),
];
const navigationSnapshot = path.join(
  uiRoot,
  'tests/contracts/shiyu-ai-navigation.json',
);
const accessFile = path.join(uiRoot, 'apps/web-naive/src/router/access.ts');

const [navigation, access] = await Promise.all([
  Promise.all(
    navigationFiles.map((file) =>
      readFile(file, 'utf8').catch((error) => {
        if (error.code !== 'ENOENT') throw error;
        return null;
      }),
    ),
  ).then(async (contents) => {
    const available = contents.filter((content) => content !== null);
    return available.length > 0
      ? available.join('\n')
      : readFile(navigationSnapshot, 'utf8');
  }),
  readFile(accessFile, 'utf8'),
]);

const featureIds = navigation.trimStart().startsWith('{')
  ? [...new Set(JSON.parse(navigation).featureIds ?? [])]
  : [
      ...new Set(
        navigation.match(/feature:[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*/g) ?? [],
      ),
    ];
const missing = featureIds.filter((id) => !access.includes(`'${id}'`));

if (missing.length > 0) {
  console.error(
    `Feature menu entries missing from router/access.ts: ${missing.join(', ')}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `Feature menu contract valid: ${featureIds.length} feature entries.`,
  );
}

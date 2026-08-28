import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const committed = join(
  root,
  'apps/web-naive/src/shared/api/generated/schema.ts',
);
const generated = join(root, '.openapi-generated.tmp.ts');

try {
  execFileSync(
    process.execPath,
    [
      join(root, 'scripts/contracts/generate-openapi.mjs'),
      `--output=${generated}`,
    ],
    { cwd: root, stdio: 'inherit' },
  );
  const expected = readFileSync(committed, 'utf8');
  const actual = readFileSync(generated, 'utf8');
  if (actual !== expected) {
    console.error(
      'OpenAPI generated types are stale. Run `pnpm generate:openapi` and commit the result.',
    );
    process.exitCode = 1;
  } else {
    console.log('OpenAPI generated types are consistent.');
  }
} finally {
  rmSync(generated, { force: true });
}

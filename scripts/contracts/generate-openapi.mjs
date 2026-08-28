import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';

const root = resolve(import.meta.dirname, '../..');
const schema = join(root, 'tests/contracts/shiyu-ai-openapi.json');
const defaultOutput = join(
  root,
  'apps/web-naive/src/shared/api/generated/schema.ts',
);
const outputArgument = process.argv.find((argument) =>
  argument.startsWith('--output='),
);
const output = outputArgument
  ? resolve(root, outputArgument.slice('--output='.length))
  : defaultOutput;
const generated = `${COMMENT_HEADER}${astToString(
  await openapiTS(JSON.parse(readFileSync(schema, 'utf8'))),
)}`;
writeFileSync(output, generated);
execFileSync(
  process.execPath,
  [join(root, 'node_modules/oxfmt/bin/oxfmt'), '--write', output],
  { cwd: root, stdio: 'inherit' },
);

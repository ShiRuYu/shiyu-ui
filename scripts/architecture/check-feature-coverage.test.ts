// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const script = fileURLToPath(
  new URL('./check-feature-coverage.mjs', import.meta.url),
);
const roots: string[] = [];
function fixture(
  files: Record<string, string>,
  covered: string[],
  emptyMetrics: string[] = [],
) {
  const root = mkdtempSync(path.join(tmpdir(), 'shiyu-feature-coverage-'));
  roots.push(root);
  const feature = path.join(root, 'apps/web-naive/src/features/example');
  mkdirSync(feature, { recursive: true });
  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(feature, file)), { recursive: true });
    writeFileSync(path.join(feature, file), content);
  }
  mkdirSync(path.join(root, 'coverage'));
  writeFileSync(
    path.join(root, 'coverage/coverage-summary.json'),
    JSON.stringify(
      Object.fromEntries(
        covered.map((file) => [
          path.join(feature, file),
          emptyMetrics.includes(file)
            ? {}
            : {
                lines: { total: 2, covered: 2 },
                branches: { total: 0, covered: 0 },
              },
        ]),
      ),
    ),
  );
  return spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      FEATURE_COVERAGE_LINES: '90',
      FEATURE_COVERAGE_BRANCHES: '80',
    },
  });
}

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('feature coverage completeness', () => {
  it('rejects empty metric entries even if another file is fully covered', () => {
    const result = fixture(
      {
        'covered.ts': 'export const value = 1;',
        'missing.ts': 'export const value = 2;',
      },
      ['covered.ts', 'missing.ts'],
      ['missing.ts'],
    );
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stderr).toContain('missing.ts');
  });
  it('fails when an existing logic file has no coverage entry', () => {
    const result = fixture(
      { 'logic.ts': 'export const value = true ? 1 : 2;' },
      [],
    );
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stderr).toContain('logic.ts');
  });

  it('fails when only part of a feature was collected', () => {
    const result = fixture(
      {
        'covered.ts': 'export const value = 1;',
        'missing.ts': 'export function compute() { return 2; }',
      },
      ['covered.ts'],
    );
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stderr).toContain('missing.ts');
  });

  it('includes Vue components in the inventory', () => {
    const result = fixture(
      { 'page.vue': '<template><button>Save</button></template>' },
      [],
    );
    expect(result.status, result.stdout + result.stderr).toBe(1);
    expect(result.stderr).toContain('page.vue');
  });

  it('allows a truly empty slice containing only types and barrel exports', () => {
    const result = fixture(
      {
        'model.ts': 'export interface Entity { id: string }',
        'index.ts': "export type { Entity } from './model';",
        '__tests__/ignored.test.ts': 'throw new Error("not production code");',
      },
      [],
    );
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });

  it('accepts complete coverage without conditional branches', () => {
    const result = fixture({ 'logic.ts': 'export const value = 1;' }, [
      'logic.ts',
    ]);
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
});

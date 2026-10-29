// @vitest-environment node
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

const original = fileURLToPath(
  new URL('./check-feature-menu-contract.mjs', import.meta.url),
);
const roots: string[] = [];
function fixture(
  backend: 'absent' | 'complete' | 'incomplete',
  access = "'feature:agent.list'",
) {
  const root = mkdtempSync(path.join(tmpdir(), 'shiyu-menu-contract-'));
  roots.push(root);
  const ui = path.join(root, 'shiyu-ui');
  const write = (relative: string, value: string) => {
    const file = path.join(root, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, value);
  };
  write('shiyu-ui/apps/web-naive/src/router/access.ts', access);
  write(
    'shiyu-ui/tests/contracts/shiyu-ai-navigation.json',
    JSON.stringify({ featureIds: ['feature:agent.list'] }),
  );
  const script = path.join(
    ui,
    'scripts/architecture/check-feature-menu-contract.mjs',
  );
  mkdirSync(path.dirname(script), { recursive: true });
  copyFileSync(original, script);
  if (backend !== 'absent') {
    const directory =
      'shiyu-ai/modules/domains/iam/shiyu-iam-implementation/src/main/resources/db/baseline/h2/seed/iam/';
    write(`${directory}02_auth.sql`, '-- auth seed');
    if (backend === 'complete')
      write(`${directory}05_navigation.sql`, "VALUES ('feature:agent.list');");
  }
  const env = { ...process.env };
  delete env.SHIYU_BACKEND_ROOT;
  return spawnSync(process.execPath, [script], {
    cwd: ui,
    encoding: 'utf8',
    env,
  });
}

afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});

describe('feature menu contract checkout modes', () => {
  it('reads the current backend module layout', () => {
    const result = fixture('complete');
    expect(result.status, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain('1 feature entries');
  });
  it('uses the snapshot when no backend checkout exists', () => {
    const result = fixture('absent');
    expect(result.status, result.stdout + result.stderr).toBe(0);
  });
  it('does not hide an incomplete backend checkout behind the snapshot', () => {
    const result = fixture('incomplete');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      'Backend navigation SQL files are incomplete',
    );
  });
  it('rejects navigation entries missing from the frontend', () => {
    const result = fixture('absent', "'feature:agent.other'");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('feature:agent.list');
  });
});

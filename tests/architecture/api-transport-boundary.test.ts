import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(import.meta.dirname, '../../apps/web-naive');

async function sourceFiles(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      result.push(...(await sourceFiles(entryPath)));
    } else if (/\.(?:ts|vue)$/.test(entry.name)) {
      result.push(entryPath);
    }
  }
  return result;
}

describe('aPI transport boundary', () => {
  it('keeps the /api prefix when proxying to the backend', async () => {
    const viteConfig = await readFile(
      path.join(appRoot, 'vite.config.ts'),
      'utf8',
    );
    expect(viteConfig).not.toMatch(/rewrite\s*:/);
  });

  it('does not send the retired numeric API version header', async () => {
    const requestAdapter = await readFile(
      path.join(appRoot, 'src/shared/api/request.ts'),
      'utf8',
    );
    expect(requestAdapter).not.toContain("headers.version = '1'");
  });

  it('contains no retired versioned request paths', async () => {
    const offenders: string[] = [];
    const retiredPrefix = ['/v', '1'].join('');
    for (const file of await sourceFiles(path.join(appRoot, 'src'))) {
      if ((await readFile(file, 'utf8')).includes(retiredPrefix)) {
        offenders.push(path.relative(appRoot, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});

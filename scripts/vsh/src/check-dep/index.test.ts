import { describe, expect, it } from 'vitest';

import { assertNoUnusedDependencies } from './index';

describe('unused dependency gate', () => {
  it('fails when production or development dependencies are unused', () => {
    expect(() =>
      assertNoUnusedDependencies({
        issues: [
          {
            dependencies: [{ col: 1, line: 3, name: 'unused-a', pos: 0 }],
            devDependencies: [],
            file: 'package.json',
            optionalPeerDependencies: [],
          },
        ],
      }),
    ).toThrow(/1 unused dependenc/);
  });

  it('accepts an empty issue report', () => {
    expect(() => assertNoUnusedDependencies({ issues: [] })).not.toThrow();
  });
});

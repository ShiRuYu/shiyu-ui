import { describe, expect, it } from 'vitest';

import { assertWithinCircularThreshold } from './index';

describe('circular dependency gate', () => {
  it('fails when the configured threshold is exceeded', () => {
    expect(() =>
      assertWithinCircularThreshold(
        [
          ['a.ts', 'b.ts'],
          ['c.ts', 'd.ts'],
        ],
        0,
      ),
    ).toThrow(/2 circular dependencies/);
  });

  it('accepts results at the explicit threshold', () => {
    expect(() =>
      assertWithinCircularThreshold([['a.ts', 'b.ts']], 1),
    ).not.toThrow();
  });
});

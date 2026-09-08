import { afterEach, describe, expect, it, vi } from 'vitest';

import { readRememberedUsername, writeRememberedUsername } from './remember-me';

describe('remember-me storage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to an empty username when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new DOMException('storage is unavailable', 'SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('storage is unavailable', 'SecurityError');
      }),
    });

    expect(readRememberedUsername('remembered-user')).toBe('');
    expect(() =>
      writeRememberedUsername('remembered-user', 'ada@example.test'),
    ).not.toThrow();
  });
});

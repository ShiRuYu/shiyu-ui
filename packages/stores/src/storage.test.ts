import { afterEach, describe, expect, it, vi } from 'vitest';

import { getBrowserStorage } from './storage';

describe('getBrowserStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to an in-memory store when browser storage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => {
        throw new Error('storage disabled');
      }),
    });

    const storage = getBrowserStorage();

    expect(() => storage.setItem('key', 'value')).not.toThrow();
    expect(storage.getItem('key')).toBe('value');
  });

  it('uses the browser storage when it is accessible', () => {
    const browserStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    vi.stubGlobal('localStorage', browserStorage);

    const storage = getBrowserStorage();

    expect(storage.getItem('missing')).toBeNull();
    expect(browserStorage.getItem).toHaveBeenCalled();
  });

  it('falls back when session storage is unavailable', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn(() => {
        throw new Error('session storage disabled');
      }),
    });

    const storage = getBrowserStorage('sessionStorage');

    storage.setItem('tab', 'open');
    expect(storage.getItem('tab')).toBe('open');
  });

  it('falls back after a storage write fails', () => {
    const browserStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
    };
    vi.stubGlobal('localStorage', browserStorage);

    const storage = getBrowserStorage();

    expect(() => storage.setItem('key', 'value')).not.toThrow();
    expect(storage.getItem('key')).toBe('value');
  });
});

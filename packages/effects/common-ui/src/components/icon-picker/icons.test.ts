import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchIconsData, ICONS_MAP } from './icons';

describe('fetchIconsData', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('allows a failed icon request to be retried', async () => {
    const prefix = `retry-${Date.now()}`;
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({
        json: async () => ({ uncategorized: ['alarm'] }),
      });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(fetchIconsData(prefix)).resolves.toEqual([]);
    await expect(fetchIconsData(prefix)).resolves.toEqual([`${prefix}:alarm`]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    delete ICONS_MAP[prefix];
  });
});

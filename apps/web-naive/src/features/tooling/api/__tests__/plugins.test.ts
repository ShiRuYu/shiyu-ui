import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import { listPlugins } from '../plugins';

describe('tooling plugin facade', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists plugins through the tooling domain endpoint', async () => {
    requestMock.get.mockResolvedValue([]);
    await listPlugins();
    expect(requestMock.get).toHaveBeenCalledWith('/api/tooling/plugins');
  });
});

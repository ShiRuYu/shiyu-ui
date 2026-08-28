import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('#/shared/api/request', () => ({
  requestClient: requestMock,
}));

import {
  batchDeleteModel,
  createModel,
  createPlatform,
  deleteModel,
  deletePlatform,
  getModelPage,
  getPlatformOptions,
  getPlatformPage,
  reloadPlatforms,
  setDefaultModel,
  setDefaultPlatform,
  updateModel,
  updatePlatform,
} from '../index';

describe('model feature transport facades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue({ items: [], total: 0 });
    requestMock.post.mockResolvedValue({});
  });

  it('normalizes model pagination before calling the model bounded context', async () => {
    await getModelPage({
      page: 2,
      pageSize: 25,
      platformId: 9,
      keyword: 'chat',
    });

    expect(requestMock.get).toHaveBeenCalledWith('/api/model/models/page', {
      params: { pageNum: 2, pageSize: 25, platformId: 9, keyword: 'chat' },
    });
  });

  it('keeps model commands and platform queries in the model facade', async () => {
    await createModel({ modelName: 'gpt', platformId: 9, status: 1 } as any);
    await setDefaultModel(4);
    await getPlatformPage({ page: 1, pageSize: 10 });
    await getPlatformOptions();

    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/model/models/create',
      expect.objectContaining({ modelName: 'gpt', platformId: 9 }),
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      2,
      '/api/model/models/set-default',
      null,
      { params: { id: 4 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      1,
      '/api/model/providers/page',
      { params: { pageNum: 1, pageSize: 10 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      2,
      '/api/model/providers/options',
    );
  });

  it('covers update/delete and platform lifecycle commands', async () => {
    await getModelPage({});
    await updateModel(4, { status: 0 });
    await deleteModel(4);
    await batchDeleteModel([4, 5]);
    await createPlatform({ code: 'openai', name: 'OpenAI', status: 1 } as any);
    await updatePlatform(2, { name: 'Updated' });
    await deletePlatform(2);
    await setDefaultPlatform(2);
    await reloadPlatforms();

    expect(requestMock.get).toHaveBeenCalledWith('/api/model/models/page', {
      params: { pageNum: 1, pageSize: 10 },
    });
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/model/models/batch-delete',
      [4, 5],
    );
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/model/providers/reload',
    );
  });
});

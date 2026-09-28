import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
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
    requestMock.put.mockResolvedValue({});
    requestMock.delete.mockResolvedValue({});
  });

  it('normalizes model pagination before calling the model bounded context', async () => {
    await getModelPage({
      page: 2,
      pageSize: 25,
      platformId: 9,
      keyword: 'chat',
    });

    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/model/model-configurations',
      {
        params: { pageNo: 2, pageSize: 25, platformId: 9, keyword: 'chat' },
      },
    );
  });

  it('keeps model commands and platform queries in the model facade', async () => {
    await createModel({ modelName: 'gpt', platformId: 9, status: 1 } as any);
    await setDefaultModel(4);
    await getPlatformPage({ page: 1, pageSize: 10 });
    await getPlatformOptions();

    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/model/model-configurations',
      expect.objectContaining({ modelName: 'gpt', platformId: 9 }),
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      2,
      '/api/model/model-configurations/set-default',
      null,
      { params: { id: 4 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(1, '/api/model/platforms', {
      params: { pageNo: 1, pageSize: 10 },
    });
    expect(requestMock.get).toHaveBeenNthCalledWith(
      2,
      '/api/model/platforms/options',
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

    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/model/model-configurations',
      {
        params: { pageNo: 1, pageSize: 10 },
      },
    );
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/model/model-configurations/batch-delete',
      [4, 5],
    );
    expect(requestMock.put).toHaveBeenCalledWith(
      '/api/model/model-configurations/4',
      expect.objectContaining({ status: 0 }),
    );
    expect(requestMock.delete).toHaveBeenCalledWith(
      '/api/model/model-configurations/4',
    );
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/model/platforms/reload',
    );
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/model/platforms',
      expect.objectContaining({ code: 'openai' }),
    );
    expect(requestMock.put).toHaveBeenCalledWith(
      '/api/model/platforms/2',
      expect.objectContaining({ name: 'Updated' }),
    );
    expect(requestMock.delete).toHaveBeenCalledWith('/api/model/platforms/2');
  });
});

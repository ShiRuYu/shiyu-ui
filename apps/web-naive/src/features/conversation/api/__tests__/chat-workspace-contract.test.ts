import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ accessToken: 'test-token' }),
}));

vi.mock('#/shared/api/request', () => ({
  requestClient: {
    getBaseUrl: () => '',
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { streamGeneration } from '#/features/conversation';

describe('chat workspace stream contract', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('reconnects from the last event id without duplicating deltas', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          'id: 4\nevent: MODEL_DELTA\ndata: {"type":"DELTA","content":"hel"}\n\n',
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          'id: 5\nevent: RUN_COMPLETED\ndata: {"type":"COMPLETED"}\n\n',
        ),
      );
    const chunks: string[] = [];

    await streamGeneration('run-1', (chunk) => chunks.push(chunk));

    expect(chunks).toEqual(['hel']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain('afterSeq=4');
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Last-Event-ID': '4',
      }),
    });
  });

  it('stops on a persisted terminal event instead of relying on fetch abort', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        'id: 8\nevent: RUN_CANCELLED\ndata: {"type":"CANCELLED"}\n\n',
      ),
    );
    const chunks: string[] = [];

    await streamGeneration('run-2', (chunk) => chunks.push(chunk));

    expect(chunks).toEqual([]);
  });
});

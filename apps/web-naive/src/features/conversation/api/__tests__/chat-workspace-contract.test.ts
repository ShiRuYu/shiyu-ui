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
          'id: 4\nevent: DELTA\ndata: {"generationRunId":"run-1","sequence":4,"type":"DELTA","payload":"hel","createdAt":"2026-10-05T00:00:00Z"}\n\n',
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          'id: 5\nevent: COMPLETED\ndata: {"generationRunId":"run-1","sequence":5,"type":"COMPLETED","payload":"{}","createdAt":"2026-10-05T00:00:01Z"}\n\n',
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
        'id: 8\nevent: CANCELLED\ndata: {"generationRunId":"run-2","sequence":8,"type":"CANCELLED","payload":"{}","createdAt":"2026-10-05T00:00:00Z"}\n\n',
      ),
    );
    const chunks: string[] = [];

    await expect(
      streamGeneration('run-2', (chunk) => chunks.push(chunk)),
    ).rejects.toMatchObject({ name: 'AbortError' });

    expect(chunks).toEqual([]);
  });

  it('rejects a durable failure after retaining only the partial answer', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        'id: 1\nevent: DELTA\ndata: {"generationRunId":"run-3","sequence":1,"type":"DELTA","payload":"partial","createdAt":"2026-10-05T00:00:00Z"}\n\n' +
          'id: 2\nevent: FAILED\ndata: {"generationRunId":"run-3","sequence":2,"type":"FAILED","payload":"MODEL_UNAVAILABLE","createdAt":"2026-10-05T00:00:01Z"}\n\n',
      ),
    );
    const chunks: string[] = [];

    await expect(
      streamGeneration('run-3', (chunk) => chunks.push(chunk)),
    ).rejects.toThrow('MODEL_UNAVAILABLE');

    expect(chunks).toEqual(['partial']);
  });

  it('delivers reasoning from the persisted event payload', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        'id: 1\nevent: REASONING_DELTA\ndata: {"generationRunId":"run-4","sequence":1,"type":"REASONING_DELTA","payload":"step","createdAt":"2026-10-05T00:00:00Z"}\n\n' +
          'id: 2\nevent: COMPLETED\ndata: {"generationRunId":"run-4","sequence":2,"type":"COMPLETED","payload":"{}","createdAt":"2026-10-05T00:00:01Z"}\n\n',
      ),
    );
    const chunks: string[] = [];
    const events: Array<{ reasoningContent?: string }> = [];

    await streamGeneration(
      'run-4',
      (chunk) => chunks.push(chunk),
      undefined,
      (event) => events.push(event),
    );

    expect(chunks).toEqual([]);
    expect(events).toContainEqual(
      expect.objectContaining({ reasoningContent: 'step' }),
    );
  });

  it('rejects a stream that never reports a terminal event', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(
          new Response(
            'id: 1\nevent: STARTED\ndata: {"generationRunId":"run-5","sequence":1,"type":"STARTED","payload":"{}","createdAt":"2026-10-05T00:00:00Z"}\n\n',
          ),
        );
      const stream = streamGeneration('run-5', () => {});
      const assertion = expect(stream).rejects.toThrow(
        'Generation stream ended before a terminal event',
      );
      await vi.runAllTimersAsync();
      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(30);
    } finally {
      vi.useRealTimers();
    }
  });
});

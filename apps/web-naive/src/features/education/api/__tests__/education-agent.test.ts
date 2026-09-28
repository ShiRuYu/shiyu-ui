import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  getBaseUrl: vi.fn<() => string | undefined>(() => 'https://api.example.test'),
  post: vi.fn(),
}));

vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));
vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ accessToken: 'education-token' }),
}));

import {
  completeReviewTask,
  generateExam,
  generatePlan,
  generateReport,
  getTodayReviewTasks,
  practice,
  teach,
  teachStream,
} from '../education-agent';

describe('education agent transport facade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue({ data: [] });
    requestMock.post.mockResolvedValue({ data: { ok: true } });
  });

  it('keeps education agent commands under the education feature', async () => {
    const payload = { studentId: 1, knowledgeId: 2 };

    await teach(payload);
    await practice({ ...payload, difficulty: 2, count: 5 });
    await generateExam({ studentId: 1, knowledgeIds: [2], duration: 30 });
    await getTodayReviewTasks();
    await completeReviewTask({ taskId: 3, result: 1 });
    await generatePlan({ ...payload, targetDate: '2026-09-12' });
    await generateReport({ studentId: 1, period: 'weekly' });

    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/agent/executions/execute',
      payload,
      { params: { agentId: 'teacher' } },
    );
    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/agent/agents/definitions',
    );
  });

  it('releases the teaching stream reader when reading fails', async () => {
    const releaseLock = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        body: {
          getReader: () => ({
            read: vi.fn().mockRejectedValue(new Error('stream interrupted')),
            releaseLock,
          }),
        },
        ok: true,
        status: 200,
      }),
    );

    await expect(
      teachStream({ studentId: 1, knowledgeId: 2, style: 'guided' }, vi.fn()),
    ).rejects.toThrow('stream interrupted');
    expect(releaseLock).toHaveBeenCalledOnce();
  });

  it('cancels the teaching stream when its abort signal fires', async () => {
    let resolveRead!: (result: { done: boolean; value?: Uint8Array }) => void;
    const read = vi.fn(
      () =>
        new Promise<{ done: boolean; value?: Uint8Array }>((resolve) => {
          resolveRead = resolve;
        }),
    );
    const cancel = vi.fn(() => {
      resolveRead({ done: true });
      return Promise.resolve();
    });
    const releaseLock = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        body: { getReader: () => ({ cancel, read, releaseLock }) },
        ok: true,
        status: 200,
      }),
    );
    const controller = new AbortController();

    const stream = teachStream({ studentId: 1, knowledgeId: 2 }, vi.fn(), {
      signal: controller.signal,
    });
    await Promise.resolve();
    controller.abort();
    await expect(stream).rejects.toMatchObject({ name: 'AbortError' });

    expect(cancel).toHaveBeenCalledOnce();
    expect(releaseLock).toHaveBeenCalledOnce();
  });

  it('flushes a teaching stream decoder when UTF-8 spans chunks', async () => {
    const chunks = [
      new TextEncoder().encode('\u{1f600}').slice(0, 2),
      new TextEncoder().encode('\u{1f600}').slice(2),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        body: {
          getReader: () => ({
            read: vi
              .fn()
              .mockResolvedValueOnce({ done: false, value: chunks[0] })
              .mockResolvedValueOnce({ done: true, value: chunks[1] }),
            releaseLock: vi.fn(),
          }),
        },
        ok: true,
        status: 200,
      }),
    );
    const received: string[] = [];

    await teachStream({ studentId: 1, knowledgeId: 2 }, (chunk) =>
      received.push(chunk),
    );

    expect(received.join('')).toBe('😀');
  });
});

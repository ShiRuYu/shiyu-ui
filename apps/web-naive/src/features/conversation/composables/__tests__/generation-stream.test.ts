import { beforeEach, describe, expect, it, vi } from 'vitest';

const conversationApi = vi.hoisted(() => ({
  cancelGeneration: vi.fn(),
  chatStream: vi.fn(),
  retryGeneration: vi.fn(),
  streamGeneration: vi.fn(),
}));
const runtimeApi = vi.hoisted(() => ({
  cancelRuntimeRun: vi.fn(),
  getRuntimeRunEvents: vi.fn(),
  streamGenerationRuntimeEvents: vi.fn(),
}));

vi.mock('#/features/conversation/api/chat', () => conversationApi);
vi.mock('#/features/agent/api/runtime', () => runtimeApi);

import { useGenerationStream } from '#/features/conversation/composables/generation-stream';

describe('useGenerationStream', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    runtimeApi.streamGenerationRuntimeEvents.mockResolvedValue(undefined);
    runtimeApi.getRuntimeRunEvents.mockResolvedValue([]);
  });

  it('forwards response and runtime trace events while releasing the stream state', async () => {
    conversationApi.chatStream.mockImplementation(
      async (_request, onChunk, options) => {
        onChunk('hello');
        options.onEvent?.({
          type: 'REASONING_DELTA',
          reasoningContent: 'plan',
        });
        options.onRunId?.('run-1');
        return 'generation-1';
      },
    );
    runtimeApi.streamGenerationRuntimeEvents.mockImplementation(
      async (_generationId, onEvent) => {
        onEvent({ runId: 'run-1', seq: 1, type: 'COMPLETED' });
      },
    );
    const chunks: string[] = [];
    const events: unknown[] = [];
    const reasoning: string[] = [];
    const stream = useGenerationStream();

    await stream.start({ prompt: 'hi', sceneType: 'chat' }, 'chat', {
      onChunk: (chunk) => chunks.push(chunk),
      onReasoning: (delta) => reasoning.push(delta),
      onRuntimeEvent: (event) => events.push(event),
    });

    expect(chunks).toEqual(['hello']);
    expect(reasoning).toEqual(['plan']);
    expect(events).toHaveLength(1);
    expect(stream.loading.value).toBe(false);
    expect(stream.activeRunId.value).toBeUndefined();
  });

  it('loads durable runtime events for agent runs and cancels the active run', async () => {
    conversationApi.chatStream.mockResolvedValue('generation-2');
    runtimeApi.getRuntimeRunEvents.mockResolvedValue([
      { runId: 'run-2', seq: 2, type: 'COMPLETED' },
    ]);
    const stream = useGenerationStream();

    const start = stream.start(
      { appId: 'app-1', prompt: 'run', sceneType: 'agent' },
      'agent',
      { onRuntimeEvents: (events) => expect(events).toHaveLength(1) },
    );
    await start;
    expect(runtimeApi.getRuntimeRunEvents).toHaveBeenCalledWith('generation-2');

    conversationApi.chatStream.mockImplementation(
      (_request, _onChunk, options) => {
        options.onRunId?.('run-3');
        return new Promise((_resolve, reject) => {
          options.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        });
      },
    );
    const pending = stream.start({ prompt: 'next' }, 'agent', {});
    await Promise.resolve();
    await stream.stop('agent');
    expect(runtimeApi.cancelRuntimeRun).toHaveBeenCalledWith('run-3');
    stream.dispose();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('retries a message and keeps runtime tracing failures observational', async () => {
    conversationApi.chatStream.mockResolvedValue('generation-chat');
    runtimeApi.streamGenerationRuntimeEvents.mockRejectedValue(
      new Error('trace unavailable'),
    );
    const stream = useGenerationStream();
    const reset = vi.fn();

    await stream.start({ prompt: 'hello' }, 'chat', { onRuntimeReset: reset });
    expect(reset).toHaveBeenCalledOnce();
    expect(stream.loading.value).toBe(false);

    conversationApi.retryGeneration.mockResolvedValue({ id: 'retry-1' });
    conversationApi.streamGeneration.mockImplementation(
      async (_id, onChunk) => {
        onChunk('retried');
      },
    );
    const chunks: string[] = [];
    const runIds: string[] = [];
    await stream.retry(
      'message-1',
      { model: 'gpt', platform: 'openai' },
      {
        onChunk: (chunk) => chunks.push(chunk),
        onRunId: (runId) => runIds.push(runId),
      },
    );
    expect(conversationApi.retryGeneration).toHaveBeenCalledWith('message-1', {
      model: 'gpt',
      platform: 'openai',
    });
    expect(conversationApi.streamGeneration).toHaveBeenCalledWith(
      'retry-1',
      expect.any(Function),
      expect.any(AbortSignal),
    );
    expect(chunks).toEqual(['retried']);
    expect(runIds).toEqual(['retry-1']);
    expect(stream.loading.value).toBe(false);

    conversationApi.chatStream.mockImplementation(
      (_request, _onChunk, options) =>
        new Promise((_resolve, reject) => {
          options.onRunId?.('chat-run');
          options.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    conversationApi.cancelGeneration.mockRejectedValue(
      new Error('cancel persistence unavailable'),
    );
    const pending = stream.start({ prompt: 'cancel me' }, 'chat');
    await Promise.resolve();
    await stream.stop('chat');
    expect(conversationApi.cancelGeneration).toHaveBeenCalledWith('chat-run');
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });
});

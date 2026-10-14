import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  getBaseUrl: vi.fn<() => string | undefined>(() => 'http://localhost'),
}));
const consumeMock = vi.hoisted(() => vi.fn());
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));
vi.mock('#/shared/api/stream', () => ({ consumeEventStream: consumeMock }));
vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ accessToken: 'token' }),
}));

import {
  cancelGeneration,
  chat,
  chatStream,
  createConversation,
  editMessage,
  getConversationMessages,
  getModelOptions,
  getPromptPreview,
  listBranches,
  listConversations,
  retryGeneration,
  setActiveLeaf,
  streamGeneration,
} from '../chat';

describe('conversation chat facade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue([]);
    requestMock.post.mockImplementation(async (url: string) =>
      url.includes('/execute')
        ? {
            executionId: 'exec-1',
            runtimeRunId: 'run-1',
            status: 'COMPLETED',
            output: { answer: 'ok' },
          }
        : { id: 'run-1' },
    );
    consumeMock.mockImplementation(
      async (
        _response: Response,
        onEvent: (event: { data: string; id?: string }) => void,
      ) => {
        onEvent({
          id: '1',
          data: JSON.stringify({
            generationRunId: 'run-1',
            sequence: 1,
            type: 'DELTA',
            payload: 'hello',
            createdAt: '2026-10-05T00:00:00Z',
          }),
        });
        onEvent({
          id: '2',
          data: JSON.stringify({
            generationRunId: 'run-1',
            sequence: 2,
            type: 'COMPLETED',
            payload: '{}',
            createdAt: '2026-10-05T00:00:01Z',
          }),
        });
      },
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('event: message\n\n')),
    );
  });

  it('covers conversation lifecycle and both agent and chat streaming paths', async () => {
    await getModelOptions(3);
    await listConversations();
    await createConversation({ title: 'Chat' });
    await getConversationMessages('c-1');
    await getPromptPreview('c-1');
    await cancelGeneration('run-1');
    await editMessage('m-1', 'edited');
    await retryGeneration('m-1', { model: 'm' });
    await listBranches('c-1');
    await setActiveLeaf('c-1', 'm-1');

    const chunks: string[] = [];
    const normalRun = await chatStream(
      { conversationId: 'c-1', prompt: 'Hi' },
      (text) => chunks.push(text),
      { onRunId: vi.fn() },
    );
    expect(normalRun).toBe('run-1');
    expect(chunks).toEqual(['hello']);
    const response = await chat({ conversationId: 'c-1', prompt: 'Again' });
    expect(response).toEqual({ content: 'hello', success: true });

    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            status: 'STARTED',
            executionId: 'exec-1',
            runtimeRunId: 'run-1',
            inputMessageId: 'message-1',
          }),
        });
        onEvent({
          data: JSON.stringify({
            status: 'COMPLETED',
            output: { answer: 'ok' },
            assistantMessageId: 'message-2',
          }),
        });
      },
    );
    const agentChunks: string[] = [];
    const agentRun = await chatStream(
      {
        appId: 'app-1',
        conversationId: 'c-1',
        sceneType: 'agent',
        prompt: 'Solve',
      },
      (text) => agentChunks.push(text),
      { onRunId: vi.fn(), onInputMessageId: vi.fn() },
    );
    expect(agentRun).toBe('run-1');
    expect(agentChunks).toEqual(['{"answer":"ok"}']);
    await streamGeneration('run-1', (text) => agentChunks.push(text));
    expect(agentChunks).toContain('hello');
    expect(requestMock.get).toHaveBeenCalled();
    expect(requestMock.post).toHaveBeenCalled();
  });

  it('keeps an agent approval pause visible without reporting a failed chat', async () => {
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            status: 'STARTED',
            executionId: 'exec-1',
            runtimeRunId: 'run-1',
          }),
        });
        onEvent({
          data: JSON.stringify({
            status: 'PAUSED',
            approvalId: 'approval-1',
            assistantMessageId: 'message-pending',
          }),
        });
      },
    );
    const chunks: string[] = [];
    const assistantMessageId = vi.fn();

    const runId = await chatStream(
      {
        appId: 'app-1',
        conversationId: 'c-1',
        sceneType: 'agent',
        prompt: 'Write',
      },
      (text) => chunks.push(text),
      { onAssistantMessageId: assistantMessageId },
    );

    expect(runId).toBe('run-1');
    expect(chunks).toEqual(['工具调用等待审批，请前往工具审批页面处理。']);
    expect(assistantMessageId).toHaveBeenCalledWith('message-pending');
  });

  it('handles conversation creation, string agent output, event content and stream errors', async () => {
    requestMock.post.mockImplementation(async (url: string) => {
      if (url.includes('/execute'))
        return {
          executionId: 'exec-2',
          status: 'COMPLETED',
          output: 'plain output',
        };
      if (url.endsWith('/conversations')) return { id: 'created-conversation' };
      return { id: 'run-2' };
    });
    requestMock.getBaseUrl.mockReturnValueOnce(undefined);
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string; id?: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            generationRunId: 'run-2',
            sequence: 1,
            type: 'DELTA',
            payload: 'content',
            createdAt: '2026-10-05T00:00:00Z',
          }),
        });
        onEvent({
          data: JSON.stringify({
            generationRunId: 'run-2',
            sequence: 2,
            type: 'COMPLETED',
            payload: '{}',
            createdAt: '2026-10-05T00:00:01Z',
          }),
        });
      },
    );
    const chunks: string[] = [];
    await chatStream({ prompt: 'new conversation' }, (text) =>
      chunks.push(text),
    );
    expect(chunks).toEqual(['content']);
    const output: string[] = [];
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            status: 'STARTED',
            executionId: 'exec-2',
            runtimeRunId: 'run-2',
            inputMessageId: 'message-2',
          }),
        });
        onEvent({
          data: JSON.stringify({ status: 'COMPLETED', output: 'plain output' }),
        });
      },
    );
    await chatStream(
      { appId: 'app-2', sceneType: 'agent', prompt: 'run' },
      (text) => output.push(text),
    );
    expect(output).toEqual(['plain output']);

    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            generationRunId: 'bad-run',
            sequence: 1,
            type: 'FAILED',
            payload: 'failed',
            createdAt: '2026-10-05T00:00:00Z',
          }),
        });
      },
    );
    await expect(streamGeneration('bad-run', () => {})).rejects.toThrow(
      'failed',
    );
  });

  it('shows Agent model chunks before completion without duplicating the final content', async () => {
    const chunks: string[] = [];
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            status: 'STARTED',
            executionId: 'exec-stream',
          }),
        });
        onEvent({ data: JSON.stringify({ status: 'DELTA', content: 'hel' }) });
        expect(chunks).toEqual(['hel']);
        onEvent({ data: JSON.stringify({ status: 'DELTA', content: 'lo' }) });
        onEvent({
          data: JSON.stringify({
            status: 'COMPLETED',
            output: { content: 'hello' },
          }),
        });
      },
    );

    await chatStream(
      {
        appId: 'app-1',
        conversationId: 'c-1',
        sceneType: 'agent',
        prompt: 'say hello',
      },
      (chunk) => chunks.push(chunk),
    );

    expect(chunks).toEqual(['hel', 'lo']);
  });

  it('does not present a failed agent execution as a successful reply', async () => {
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            status: 'STARTED',
            executionId: 'exec-failed',
            runtimeRunId: 'run-failed',
          }),
        });
        onEvent({ data: JSON.stringify({ status: 'FAILED' }) });
      },
    );
    const output: string[] = [];
    await expect(
      chatStream(
        { appId: 'app-1', sceneType: 'agent', prompt: 'Solve' },
        (text) => output.push(text),
      ),
    ).rejects.toThrow('Agent 执行失败');
    expect(output).toEqual([]);
  });

  it('treats an Agent cancellation as a stopped generation', async () => {
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string }) => void,
      ) => {
        onEvent({
          data: JSON.stringify({
            status: 'STARTED',
            executionId: 'exec-cancelled',
            runtimeRunId: 'run-cancelled',
          }),
        });
        onEvent({ data: JSON.stringify({ status: 'CANCELLED' }) });
      },
    );
    await expect(
      chatStream(
        {
          appId: 'app-1',
          conversationId: 'c-1',
          sceneType: 'agent',
          prompt: 'Solve',
        },
        () => {},
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('passes an abort signal to generation setup requests', async () => {
    const controller = new AbortController();
    requestMock.post.mockImplementation(async (url: string) =>
      url.endsWith('/conversations')
        ? { id: 'created-conversation' }
        : { id: 'run-2' },
    );

    await chatStream(
      { prompt: 'new conversation', model: 'gpt', platform: 'openai' },
      () => {},
      { signal: controller.signal },
    );

    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/conversation/conversations',
      expect.any(Object),
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/conversation/conversations/created-conversation/generations',
      expect.any(Object),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('reports the persisted input message ID returned by generation creation', async () => {
    requestMock.post.mockResolvedValue({
      id: 'generation-1',
      inputMessageId: 'message-server-1',
      conversationId: 'conversation-1',
    });
    const persistedIds: string[] = [];

    await chatStream(
      { conversationId: 'conversation-1', prompt: 'hello' },
      () => {},
      { onInputMessageId: (id) => persistedIds.push(id) },
    );

    expect(persistedIds).toEqual(['message-server-1']);
  });

  it('removes reconnect abort listeners after the wait completes', async () => {
    const signal = {
      aborted: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as AbortSignal;
    let attempt = 0;
    consumeMock.mockImplementation(async (_response, onEvent) => {
      onEvent(
        attempt++ === 0
          ? {
              data: JSON.stringify({
                generationRunId: 'run-reconnect',
                sequence: 1,
                type: 'DELTA',
                payload: 'hello',
                createdAt: '2026-10-05T00:00:00Z',
              }),
            }
          : {
              data: JSON.stringify({
                generationRunId: 'run-reconnect',
                sequence: 2,
                type: 'COMPLETED',
                payload: '{}',
                createdAt: '2026-10-05T00:00:01Z',
              }),
            },
      );
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('event: message\n\n')),
    );

    await streamGeneration('run-reconnect', () => {}, signal);

    expect(signal.removeEventListener).toHaveBeenCalledWith(
      'abort',
      expect.any(Function),
    );
  });
});

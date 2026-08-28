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
            type: 'DELTA',
            success: true,
            payload: 'hello',
          }),
        });
        onEvent({
          id: '2',
          data: JSON.stringify({
            type: 'COMPLETED',
            success: true,
            content: '',
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

    const agentChunks: string[] = [];
    const agentRun = await chatStream(
      { appId: 'app-1', sceneType: 'agent', prompt: 'Solve' },
      (text) => agentChunks.push(text),
      { onRunId: vi.fn() },
    );
    expect(agentRun).toBe('run-1');
    expect(agentChunks).toEqual(['{"answer":"ok"}']);
    await streamGeneration('run-1', (text) => agentChunks.push(text));
    expect(agentChunks).toContain('hello');
    expect(requestMock.get).toHaveBeenCalled();
    expect(requestMock.post).toHaveBeenCalled();
  });

  it('handles conversation creation, string agent output, event content and stream errors', async () => {
    requestMock.post.mockImplementation(async (url: string) => {
      if (url.includes('/execute'))
        return { executionId: 'exec-2', output: 'plain output' };
      if (url.endsWith('/conversations')) return { id: 'created-conversation' };
      return { id: 'run-2' };
    });
    requestMock.getBaseUrl.mockReturnValueOnce(undefined);
    consumeMock.mockImplementationOnce(
      async (
        _response: Response,
        onEvent: (event: { data: string; id?: string }) => void,
      ) => {
        onEvent({ data: '' });
        onEvent({ data: '[DONE]' });
        onEvent({
          data: JSON.stringify({
            type: 'DELTA',
            success: true,
            content: 'content',
          }),
        });
        onEvent({ data: 'plain text' });
        onEvent({ data: JSON.stringify({ type: 'CANCELLED', success: true }) });
      },
    );
    const chunks: string[] = [];
    await chatStream({ prompt: 'new conversation' }, (text) =>
      chunks.push(text),
    );
    expect(chunks).toEqual(['content', 'plain text']);
    const output: string[] = [];
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
            type: 'FAILED',
            success: false,
            errorMessage: 'failed',
          }),
        });
      },
    );
    await expect(streamGeneration('bad-run', () => {})).rejects.toThrow(
      'failed',
    );
  });
});

import { flushPromises, shallowMount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  createConversation: vi.fn(),
  editMessage: vi.fn(),
  getConversationMessages: vi.fn(),
  getModelOptions: vi.fn(),
  getPromptPreview: vi.fn(),
  getPlatformOptions: vi.fn(),
  listBranches: vi.fn(),
  listConversations: vi.fn(),
  listRuntimeApps: vi.fn(),
  retry: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
}));

vi.mock('#/features/conversation', () => ({
  createConversation: api.createConversation,
  editMessage: api.editMessage,
  getConversationMessages: api.getConversationMessages,
  getModelOptions: api.getModelOptions,
  getPromptPreview: api.getPromptPreview,
  listBranches: api.listBranches,
  listConversations: api.listConversations,
  useGenerationStream: () => ({
    dispose: vi.fn(),
    loading: { value: false },
    retry: api.retry,
    start: api.start,
    stop: api.stop,
  }),
}));
vi.mock('#/features/agent', () => ({ listRuntimeApps: api.listRuntimeApps }));
vi.mock('#/features/model', () => ({
  getPlatformOptions: api.getPlatformOptions,
}));
vi.mock('#/locales', () => ({ $t: (key: string) => key }));
vi.mock('#/utils/markdown', () => ({
  renderSafeMarkdown: (text: string) => text,
}));
vi.mock('@vben/common-ui', () => ({
  Page: { template: '<div><slot /></div>' },
}));
vi.mock('naive-ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('naive-ui')>()),
  useMessage: () => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }),
}));

import ChatPage from '../chat.vue';

interface ViewModel {
  activeConversationId?: string;
  canSend: boolean;
  editingMessageId?: string;
  editingText: string;
  input: string;
  loadConversation: (id: string) => Promise<void>;
  messages: Array<{
    content: string;
    id: string;
    persisted?: boolean;
    role: string;
    status?: string;
  }>;
  mode: string;
  selectedAppId?: string;
  selectedModel?: string;
  selectedPlatformId?: number;
  retryMessage: (index: number) => Promise<void>;
  saveEdit: () => Promise<void>;
  sendMessage: () => Promise<void>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function mountChat() {
  const wrapper = shallowMount(ChatPage);
  return { wrapper, view: wrapper.vm as unknown as ViewModel };
}

describe('chat page identity and selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.createConversation.mockResolvedValue({
      id: 'created',
      title: 'Created',
    });
    api.getConversationMessages.mockResolvedValue([]);
    api.getModelOptions.mockResolvedValue([
      { name: 'Model', value: 'model-1' },
    ]);
    api.getPlatformOptions.mockResolvedValue([
      { code: 'PLATFORM', id: 1, name: 'Platform' },
    ]);
    api.listBranches.mockResolvedValue([]);
    api.listConversations.mockResolvedValue([]);
    api.listRuntimeApps.mockResolvedValue([]);
    api.retry.mockResolvedValue(undefined);
    api.start.mockResolvedValue(undefined);
    api.stop.mockResolvedValue(undefined);
  });

  it('commits a conversation switch only after its messages load', async () => {
    const second = deferred<
      Array<{
        contentParts: Array<{ text: string; type: string }>;
        id: string;
        role: 'USER';
      }>
    >();
    api.getConversationMessages.mockImplementation((id: string) =>
      id === 'second'
        ? second.promise
        : Promise.resolve([
            {
              id: 'first-user',
              role: 'USER',
              contentParts: [{ type: 'text', text: 'first' }],
            },
          ]),
    );
    const { view, wrapper } = mountChat();
    await flushPromises();
    await view.loadConversation('first');
    const pending = view.loadConversation('second');

    expect(view.activeConversationId).toBe('first');
    expect(view.messages.map((message) => message.content)).toEqual(['first']);
    view.input = 'must wait';
    await view.sendMessage();
    expect(api.start).not.toHaveBeenCalled();

    second.resolve([
      {
        id: 'second-user',
        role: 'USER',
        contentParts: [{ type: 'text', text: 'second' }],
      },
    ]);
    await pending;
    expect(view.activeConversationId).toBe('second');
    expect(view.messages.map((message) => message.content)).toEqual(['second']);
    wrapper.unmount();
  });

  it('restores the saved provider and model when opening a conversation', async () => {
    api.getPlatformOptions.mockResolvedValue([
      { code: 'OPENAI', id: 1, name: 'OpenAI' },
      { code: 'DEEPSEEK', id: 2, name: 'DeepSeek' },
    ]);
    api.getModelOptions.mockImplementation(async (platformId: number) =>
      platformId === 2
        ? [{ name: 'DeepSeek Flash', value: 'deepseek-flash' }]
        : [{ name: 'GPT-4o', value: 'gpt-4o' }],
    );
    api.listConversations.mockResolvedValue([
      {
        id: 'deepseek-conversation',
        model: 'deepseek-flash',
        platform: 'DEEPSEEK',
        sceneType: 'chat',
        title: 'DeepSeek',
      },
    ]);

    const { view, wrapper } = mountChat();
    await flushPromises();
    await view.loadConversation('deepseek-conversation');

    expect(view.selectedPlatformId).toBe(2);
    expect(view.selectedModel).toBe('deepseek-flash');
    wrapper.unmount();
  });

  it('sends once to the newly created conversation while creation is pending', async () => {
    const creation = deferred<{ id: string; title: string }>();
    api.createConversation.mockReturnValue(creation.promise);
    const { view, wrapper } = mountChat();
    await flushPromises();
    view.input = 'hello';
    const first = view.sendMessage();
    const duplicate = view.sendMessage();
    const switchAttempt = view.loadConversation('other');

    expect(api.createConversation).toHaveBeenCalledTimes(1);
    expect(api.getConversationMessages).not.toHaveBeenCalled();
    creation.resolve({ id: 'created', title: 'Created' });
    await Promise.all([first, duplicate, switchAttempt]);
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(api.start.mock.calls[0]?.[0]).toMatchObject({
      conversationId: 'created',
      prompt: 'hello',
    });
    wrapper.unmount();
  });

  it('edits and retries only with a server message ID', async () => {
    const { view, wrapper } = mountChat();
    await flushPromises();
    await view.loadConversation('existing');
    view.input = 'question';
    api.start.mockImplementationOnce(async () => {
      throw new Error('model failed');
    });
    await view.sendMessage();
    const user = view.messages.find((message) => message.role === 'user');
    expect(user?.persisted).toBe(false);
    view.editingMessageId = user?.id;
    view.editingText = 'edited';
    await view.saveEdit();
    expect(api.editMessage).not.toHaveBeenCalled();

    const assistantIndex = view.messages.findIndex(
      (message) => message.role === 'assistant',
    );
    await view.retryMessage(assistantIndex);
    expect(api.retry).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('uses the generation response input ID for edit and durable retry', async () => {
    const { view, wrapper } = mountChat();
    await flushPromises();
    await view.loadConversation('existing');
    view.input = 'question';
    api.start.mockImplementationOnce(async (_request, _mode, handlers) => {
      handlers.onInputMessageId?.('server-user');
      throw new Error('model failed');
    });
    await view.sendMessage();
    const user = view.messages.find((message) => message.role === 'user');
    expect(user).toMatchObject({ id: 'server-user', persisted: true });
    api.retry.mockRejectedValueOnce(new Error('still failed'));
    const assistantIndex = view.messages.findIndex(
      (message) => message.role === 'assistant',
    );
    await view.retryMessage(assistantIndex);
    expect(api.retry).toHaveBeenCalledWith(
      'server-user',
      expect.any(Object),
      expect.any(Object),
    );

    view.editingMessageId = user?.id;
    view.editingText = 'edited';
    await view.saveEdit();
    expect(api.editMessage).toHaveBeenCalledWith('server-user', 'edited');
    wrapper.unmount();
  });

  it('restores Agent mode and retries through the published app with the source message ID', async () => {
    api.listConversations.mockResolvedValue([
      { id: 'agent-conversation', sceneType: 'agent', title: 'Agent' },
    ]);
    api.listRuntimeApps.mockResolvedValue([{ id: 'app-1', name: 'App' }]);
    api.getConversationMessages.mockResolvedValue([
      {
        id: 'user-1',
        role: 'USER',
        contentParts: [{ type: 'text', text: 'solve this' }],
      },
      {
        id: 'assistant-1',
        role: 'ASSISTANT',
        contentParts: [{ type: 'text', text: 'answer' }],
        toolCall: { appId: 'app-1', status: 'COMPLETED' },
      },
    ]);
    const { view, wrapper } = mountChat();
    await flushPromises();
    await view.loadConversation('agent-conversation');
    expect(view.mode).toBe('agent');

    await view.retryMessage(1);

    expect(api.start).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'app-1',
        conversationId: 'agent-conversation',
        sceneType: 'agent',
        sourceMessageId: 'user-1',
      }),
      'agent',
      expect.any(Object),
    );
    expect(api.retry).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('allows Agent sending with a published app when no chat model is configured', async () => {
    api.getPlatformOptions.mockResolvedValue([]);
    api.listRuntimeApps.mockResolvedValue([{ id: 'app-1', name: 'App' }]);
    const { view, wrapper } = mountChat();
    await flushPromises();
    view.mode = 'agent';
    view.input = 'run agent';

    expect(view.selectedAppId).toBe('app-1');
    expect(view.canSend).toBe(true);
    view.selectedAppId = undefined;
    expect(view.canSend).toBe(false);
    view.selectedAppId = 'app-1';
    await view.sendMessage();
    expect(api.start).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: 'app-1',
        sceneType: 'agent',
        prompt: 'run agent',
      }),
      'agent',
      expect.any(Object),
    );
    wrapper.unmount();
  });
});

import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/shared/api/request';
import { consumeEventStream } from '#/shared/api/stream';

export namespace ChatApi {
  export interface ChatRequest {
    model?: string;
    platform?: string;
    prompt: string;
    conversationId?: string;
    sceneType?: string;
    appId?: string;
    appVersionId?: string;
  }

  export interface ChatResponse {
    content: string;
    success: boolean;
    type?: string;
    reasoningContent?: string;
    payload?: string;
    errorMessage?: string;
  }
  export interface Conversation {
    id: string;
    title?: string;
    sceneType?: string;
    status?: string;
    activeLeafMessageId?: string;
  }
  export interface ConversationMessage {
    id: string;
    role: 'ASSISTANT' | 'SYSTEM' | 'TOOL' | 'USER';
    contentParts?: Array<{ text?: string; type: string }>;
  }
  export interface PromptPreview {
    messages: ConversationMessage[];
    sources?: Array<{
      content: string;
      estimatedTokens: number;
      source: string;
    }>;
    estimatedTokens: number;
    truncated: boolean;
    truncationReason?: string;
    modelParameters?: Record<string, unknown>;
    promptHash?: string;
  }

  export interface OptionItem {
    code?: string;
    id: number;
    name: string;
    value?: string;
  }
}

async function getModelOptions(platformId?: number) {
  return requestClient.get<ChatApi.OptionItem[]>('/api/model/models/options', {
    params: platformId ? { platformId } : {},
  });
}

async function listConversations() {
  return requestClient.get<ChatApi.Conversation[]>(
    '/api/conversation/conversations',
    { params: { limit: 50, offset: 0 } },
  );
}

async function createConversation(data: {
  model?: string;
  platform?: string;
  sceneType?: string;
  systemPrompt?: string;
  title?: string;
}) {
  return requestClient.post<ChatApi.Conversation>(
    '/api/conversation/conversations',
    { ...data, sceneType: data.sceneType ?? 'chat' },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  );
}

async function getConversationMessages(id: string) {
  return requestClient.get<ChatApi.ConversationMessage[]>(
    `/api/conversation/conversations/${id}/messages`,
  );
}

async function getPromptPreview(id: string) {
  return requestClient.get<ChatApi.PromptPreview>(
    `/api/conversation/conversations/${id}/prompt-preview`,
  );
}

async function cancelGeneration(id: string) {
  return requestClient.post(`/api/conversation/generations/${id}/cancel`);
}

async function editMessage(messageId: string, content: string) {
  return requestClient.post(
    `/api/conversation/messages/${messageId}/edits`,
    { content },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  );
}

async function retryGeneration(
  messageId: string,
  data: { model?: string; platform?: string },
) {
  return requestClient.post<{ id: string }>(
    `/api/conversation/messages/${messageId}/generations`,
    data,
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  );
}

async function listBranches(conversationId: string) {
  return requestClient.get<ChatApi.Conversation[]>(
    `/api/conversation/conversations/${conversationId}/branches`,
  );
}

async function setActiveLeaf(conversationId: string, messageId: string) {
  return requestClient.post(
    `/api/conversation/conversations/${conversationId}/active-leaf`,
    { messageId },
  );
}

async function chat(data: ChatApi.ChatRequest) {
  let content = '';
  await chatStream(data, (chunk) => {
    content += chunk;
  });
  return { content, success: true } satisfies ChatApi.ChatResponse;
}

async function chatStream(
  data: ChatApi.ChatRequest,
  onMessage: (text: string) => void,
  options: {
    onEvent?: (
      event: ChatApi.ChatResponse & { payload?: string; type?: string },
    ) => void;
    onRunId?: (runId: string) => void;
    signal?: AbortSignal;
  } = {},
): Promise<string> {
  if (data.appId && data.sceneType === 'agent') {
    const result = await requestClient.post<{
      executionId: string;
      output?: unknown;
      runtimeRunId?: string;
    }>(`/api/agent/apps/${data.appId}/execute`, {
      prompt: data.prompt,
      appVersionId: data.appVersionId,
    });
    const output =
      typeof result.output === 'string'
        ? result.output
        : JSON.stringify(result.output ?? '');
    if (output) onMessage(output);
    const runId = result.runtimeRunId ?? result.executionId;
    options.onRunId?.(runId);
    return runId;
  }
  const conversation = data.conversationId
    ? { id: data.conversationId }
    : await requestClient.post<{ id: string }>(
        '/api/conversation/conversations',
        {
          platform: data.platform,
          model: data.model,
          sceneType: data.sceneType ?? 'chat',
        },
        { headers: { 'Idempotency-Key': crypto.randomUUID() } },
      );
  const run = await requestClient.post<{ id: string }>(
    `/api/conversation/conversations/${conversation.id}/generations`,
    {
      content: data.prompt,
      platform: data.platform,
      model: data.model,
      appId: data.appId,
    },
    { headers: { 'Idempotency-Key': crypto.randomUUID() } },
  );
  options.onRunId?.(run.id);
  await streamGeneration(run.id, onMessage, options.signal, options.onEvent);
  return run.id;
}

async function streamGeneration(
  generationId: string,
  onMessage: (text: string) => void,
  signal?: AbortSignal,
  onEvent?: (
    event: ChatApi.ChatResponse & { payload?: string; type?: string },
  ) => void,
): Promise<void> {
  let lastEventId = '-1';
  let terminal = false;
  for (let attempt = 0; attempt < 30 && !terminal; attempt++) {
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    const baseURL = requestClient.getBaseUrl() ?? '';
    const response = await fetch(
      `${baseURL}/api/conversation/generations/${generationId}/events?afterSeq=${encodeURIComponent(lastEventId)}&follow=true&waitMs=30000`,
      {
        headers: {
          Accept: 'text/event-stream',
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
          ...(lastEventId !== '-1' ? { 'Last-Event-ID': lastEventId } : {}),
        },
        method: 'GET',
        signal,
      },
    );
    await consumeEventStream(
      response,
      ({ data: eventData, id }) => {
        if (id) lastEventId = id;
        if (!eventData || eventData === '[DONE]') return;
        try {
          const payload = JSON.parse(eventData) as ChatApi.ChatResponse & {
            errorMessage?: string;
            payload?: string;
            type?: string;
          };
          onEvent?.(payload);
          if (
            payload.type === 'COMPLETED' ||
            payload.type === 'FAILED' ||
            payload.type === 'CANCELLED'
          )
            terminal = true;
          if (!payload.success && payload.errorMessage)
            throw new Error(payload.errorMessage);
          if (payload.content) onMessage(payload.content);
          else if (payload.type === 'DELTA' && payload.payload)
            onMessage(payload.payload);
        } catch (error) {
          if (error instanceof SyntaxError) onMessage(eventData);
          else throw error;
        }
      },
      signal,
    );
    if (!terminal)
      await new Promise<void>((resolve, reject) => {
        const timer = globalThis.setTimeout(resolve, 250);
        signal?.addEventListener(
          'abort',
          () => {
            globalThis.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
      });
  }
  if (!terminal)
    throw new Error('Generation stream ended before a terminal event');
}

export {
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
};

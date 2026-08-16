import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';
import { consumeEventStream } from '#/api/stream';

export namespace ChatApi {
  export interface ChatRequest {
    model?: string;
    platform?: string;
    prompt: string;
    conversationId?: string;
    sceneType?: string;
    appId?: string;
  }

  export interface ChatResponse {
    content: string;
    success: boolean;
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
  return requestClient.get<ChatApi.OptionItem[]>('/agent/model/options', {
    params: platformId ? { platformId } : {},
  });
}

async function listConversations() {
  return requestClient.get<ChatApi.Conversation[]>('/conversations', {
    params: { limit: 50, offset: 0 },
  });
}

async function createConversation(data: {
  model?: string;
  platform?: string;
  sceneType?: string;
  systemPrompt?: string;
  title?: string;
}) {
  return requestClient.post<ChatApi.Conversation>('/conversations', {
    ...data,
    sceneType: data.sceneType ?? 'chat',
  });
}

async function getConversationMessages(id: string) {
  return requestClient.get<ChatApi.ConversationMessage[]>(
    `/conversations/${id}/messages`,
  );
}

async function getPromptPreview(id: string) {
  return requestClient.get<ChatApi.PromptPreview>(
    `/conversations/${id}/prompt-preview`,
  );
}

async function cancelGeneration(id: string) {
  return requestClient.post(`/generations/${id}/cancel`);
}

async function editMessage(messageId: string, content: string) {
  return requestClient.post(`/messages/${messageId}/edits`, { content });
}

async function retryGeneration(
  messageId: string,
  data: { model?: string; platform?: string },
) {
  return requestClient.post<{ id: string }>(
    `/messages/${messageId}/generations`,
    data,
  );
}

async function listBranches(conversationId: string) {
  return requestClient.get<ChatApi.Conversation[]>(
    `/conversations/${conversationId}/branches`,
  );
}

async function setActiveLeaf(conversationId: string, messageId: string) {
  return requestClient.post(`/conversations/${conversationId}/active-leaf`, {
    messageId,
  });
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
  options: { onRunId?: (runId: string) => void; signal?: AbortSignal } = {},
): Promise<string> {
  if (data.appId && data.sceneType === 'agent') {
    const result = await requestClient.post<{
      executionId: string;
      output?: unknown;
      runtimeRunId?: string;
    }>(`/v1/apps/${data.appId}/execute`, { prompt: data.prompt });
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
    : await requestClient.post<{ id: string }>('/conversations', {
        platform: data.platform,
        model: data.model,
        sceneType: data.sceneType ?? 'chat',
      });
  const run = await requestClient.post<{ id: string }>(
    `/conversations/${conversation.id}/generations`,
    {
      content: data.prompt,
      platform: data.platform,
      model: data.model,
      appId: data.appId,
    },
  );
  options.onRunId?.(run.id);
  await streamGeneration(run.id, onMessage, options.signal);
  return run.id;
}

async function streamGeneration(
  generationId: string,
  onMessage: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  let lastEventId = '-1';
  let terminal = false;
  for (let attempt = 0; attempt < 30 && !terminal; attempt++) {
    const accessStore = useAccessStore();
    const token = accessStore.accessToken;
    const baseURL = requestClient.getBaseUrl() ?? '';
    const response = await fetch(
      `${baseURL}/generations/${generationId}/events?afterSeq=${encodeURIComponent(lastEventId)}`,
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
        const timer = window.setTimeout(resolve, 250);
        signal?.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer);
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

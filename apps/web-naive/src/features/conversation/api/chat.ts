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
    sourceMessageId?: string;
  }

  export interface ChatResponse {
    content: string;
    success: boolean;
    type?: string;
    reasoningContent?: string;
    payload?: string;
    errorMessage?: string;
  }
  export interface GenerationEvent {
    createdAt: string;
    generationRunId: string;
    payload: string;
    sequence: number;
    type: string;
  }
  export interface Conversation {
    id: string;
    model?: string;
    platform?: string;
    title?: string;
    sceneType?: string;
    status?: string;
    activeLeafMessageId?: string;
  }
  export interface ConversationMessage {
    id: string;
    role: 'ASSISTANT' | 'SYSTEM' | 'TOOL' | 'USER';
    contentParts?: Array<{ text?: string; type: string }>;
    toolCall?: Record<string, unknown>;
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
  return requestClient.get<ChatApi.OptionItem[]>(
    '/api/model/model-configurations/options',
    { params: platformId ? { platformId } : {} },
  );
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
  options: { signal?: AbortSignal } = {},
) {
  const requestOptions = {
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    ...(options.signal ? { signal: options.signal } : {}),
  };
  return requestClient.post<{ id: string }>(
    `/api/conversation/messages/${messageId}/generations`,
    data,
    requestOptions,
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
    onAssistantMessageId?: (messageId: string) => void;
    onEvent?: (
      event: ChatApi.ChatResponse & { payload?: string; type?: string },
    ) => void;
    onInputMessageId?: (messageId: string) => void;
    onRunId?: (runId: string) => void;
    signal?: AbortSignal;
  } = {},
): Promise<string> {
  if (data.appId && data.sceneType === 'agent') {
    const conversationId =
      data.conversationId ??
      (
        await createConversation({
          model: data.model,
          platform: data.platform,
          sceneType: 'agent',
        })
      ).id;
    const token = useAccessStore().accessToken;
    const baseURL = requestClient.getBaseUrl() ?? '';
    const response = await fetch(
      `${baseURL}/api/conversation/conversations/${conversationId}/agent-executions`,
      {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: data.appId,
          appVersionId: data.appVersionId,
          prompt: data.prompt,
          sourceMessageId: data.sourceMessageId,
        }),
        signal: options.signal,
      },
    );
    let runId = '';
    let terminal = '';
    let streamedContent = '';
    await consumeEventStream(
      response,
      (frame) => {
        const event = JSON.parse(frame.data) as {
          assistantMessageId?: string;
          content?: string;
          executionId?: string;
          inputMessageId?: string;
          output?: unknown;
          runtimeRunId?: string;
          status?: string;
        };
        if (event.status === 'STARTED') {
          runId = event.runtimeRunId ?? event.executionId ?? '';
          if (runId) options.onRunId?.(runId);
          if (event.inputMessageId)
            options.onInputMessageId?.(event.inputMessageId);
        } else if (event.status === 'DELTA') {
          if (typeof event.content === 'string' && event.content) {
            streamedContent += event.content;
            onMessage(event.content);
          }
        } else if (event.status === 'COMPLETED') {
          terminal = 'COMPLETED';
          if (event.assistantMessageId)
            options.onAssistantMessageId?.(event.assistantMessageId);
          const output =
            typeof event.output === 'string'
              ? event.output
              : event.output &&
                  typeof event.output === 'object' &&
                  'content' in event.output &&
                  typeof event.output.content === 'string'
                ? event.output.content
                : JSON.stringify(event.output ?? '');
          if (output && !streamedContent) onMessage(output);
          else if (output.startsWith(streamedContent)) {
            const remainder = output.slice(streamedContent.length);
            if (remainder) onMessage(remainder);
          }
        } else if (event.status === 'FAILED' || event.status === 'CANCELLED') {
          terminal = event.status;
        } else if (event.status === 'PAUSED') {
          terminal = 'PAUSED';
          if (event.assistantMessageId)
            options.onAssistantMessageId?.(event.assistantMessageId);
          onMessage('工具调用等待审批，请前往工具审批页面处理。');
        }
      },
      options.signal,
    );
    if (terminal === 'CANCELLED') {
      throw new DOMException('Aborted', 'AbortError');
    }
    if (terminal === 'PAUSED') return runId;
    if (terminal !== 'COMPLETED') {
      throw new Error(`Agent 执行失败：${terminal || 'UNKNOWN'}`);
    }
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
        {
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          ...(options.signal ? { signal: options.signal } : {}),
        },
      );
  const run = await requestClient.post<{
    id: string;
    inputMessageId?: string;
  }>(
    `/api/conversation/conversations/${conversation.id}/generations`,
    {
      content: data.prompt,
      platform: data.platform,
      model: data.model,
      appId: data.appId,
    },
    {
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      ...(options.signal ? { signal: options.signal } : {}),
    },
  );
  if (run.inputMessageId) options.onInputMessageId?.(run.inputMessageId);
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
        const payload = JSON.parse(eventData) as ChatApi.GenerationEvent;
        if (
          !payload ||
          typeof payload.type !== 'string' ||
          typeof payload.payload !== 'string'
        ) {
          throw new Error('Invalid generation event');
        }
        onEvent?.({
          content: payload.type === 'DELTA' ? payload.payload : '',
          payload: payload.payload,
          reasoningContent:
            payload.type === 'REASONING_DELTA' ? payload.payload : undefined,
          success: payload.type !== 'FAILED' && payload.type !== 'CANCELLED',
          type: payload.type,
        });
        if (payload.type === 'DELTA' && payload.payload)
          onMessage(payload.payload);
        if (payload.type === 'COMPLETED') terminal = true;
        if (payload.type === 'FAILED')
          throw new Error(payload.payload || 'Generation failed');
        if (payload.type === 'CANCELLED')
          throw new DOMException('Generation cancelled', 'AbortError');
      },
      signal,
    );
    if (!terminal) await waitForReconnect(signal, 250);
  }
  if (!terminal)
    throw new Error('Generation stream ended before a terminal event');
}

function waitForReconnect(signal: AbortSignal | undefined, delay: number) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(onTimeout, delay);

    const cleanup = () => {
      globalThis.clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };
    const settle = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };
    const onAbort = () =>
      settle(() => reject(new DOMException('Aborted', 'AbortError')));
    function onTimeout() {
      settle(resolve);
    }

    if (signal?.aborted) onAbort();
    else signal?.addEventListener('abort', onAbort, { once: true });
  });
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

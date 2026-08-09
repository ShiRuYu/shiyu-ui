import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';
import { consumeEventStream } from '#/api/stream';

export namespace ChatApi {
  export interface ChatRequest {
    model?: string;
    platform?: string;
    prompt: string;
  }

  export interface ChatResponse {
    content: string;
    success: boolean;
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

async function chat(data: ChatApi.ChatRequest) {
  return requestClient.post<ChatApi.ChatResponse>('/chat/send', data);
}

async function chatStream(
  data: ChatApi.ChatRequest,
  onMessage: (text: string) => void,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const response = await fetch(`${baseURL}/chat/send-stream`, {
    body: JSON.stringify(data),
    headers: {
      Accept: 'text/event-stream',
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: options.signal,
  });

  await consumeEventStream(
    response,
    ({ data: eventData }) => {
      if (!eventData || eventData === '[DONE]') return;
      try {
        const payload = JSON.parse(eventData) as ChatApi.ChatResponse & {
          errorMessage?: string;
        };
        if (!payload.success && payload.errorMessage) {
          throw new Error(payload.errorMessage);
        }
        if (payload.content) onMessage(payload.content);
      } catch (error) {
        if (error instanceof SyntaxError) onMessage(eventData);
        else throw error;
      }
    },
    options.signal,
  );
}

export { chat, chatStream, getModelOptions };

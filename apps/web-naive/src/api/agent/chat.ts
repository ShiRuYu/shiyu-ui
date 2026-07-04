import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

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
  return requestClient.get<ChatApi.OptionItem[]>('/admin/model/options', {
    params: platformId ? { platformId } : {},
  });
}

async function chat(data: ChatApi.ChatRequest) {
  return requestClient.post<ChatApi.ChatResponse>('/api/lc4j/chat', data);
}

async function chatStream(
  data: ChatApi.ChatRequest,
  onMessage: (text: string) => void,
): Promise<void> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const response = await fetch(`${baseURL}/api/lc4j/chat/stream`, {
    body: JSON.stringify(data),
    headers: {
      Accept: 'text/event-stream',
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok || !response.body) {
    throw new Error(`Stream error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    onMessage(text);
  }
}

export { chat, chatStream, getModelOptions };

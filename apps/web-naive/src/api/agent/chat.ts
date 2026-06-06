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
}

/**
 * 获取可用的 AI 平台列表
 */
async function getPlatforms() {
  return requestClient.get<string[]>('/api/lc4j/platforms');
}

/**
 * 获取平台默认模型
 */
async function getDefaultModel(platform: string) {
  return requestClient.get<{ defaultModel: string; platform: string }>(
    '/api/lc4j/default-model',
    { params: { platform } },
  );
}

/**
 * 同步对话
 */
async function chat(data: ChatApi.ChatRequest) {
  return requestClient.post<ChatApi.ChatResponse>('/api/lc4j/chat', data);
}

export { chat, getDefaultModel, getPlatforms };

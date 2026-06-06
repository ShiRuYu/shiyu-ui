import { requestClient } from '#/api/request';

/** Agent 定义 */
export interface AgentDefinition {
  agentId: string;
  name: string;
  description: string;
  currentVersion: string;
  versions: AgentVersion[];
  createdAt: number;
  updatedAt: number;
}

/** Agent 版本 */
export interface AgentVersion {
  versionNumber: string;
  description: string;
  createdAt: number;
}

/** Agent 注册请求 */
export interface RegisterAgentRequest {
  agentId: string;
  name: string;
  description: string;
  versionNumber?: string;
  versionDescription?: string;
}

/** Agent 执行结果 */
export interface AgentExecuteResult {
  [key: string]: any;
}

/**
 * 获取 Agent 列表
 */
export function getAgentListApi() {
  return requestClient.get<AgentDefinition[]>('/agent/list');
}

/**
 * 获取 Agent 详情
 */
export function getAgentDetailApi(agentId: string) {
  return requestClient.get<AgentDefinition>(`/agent/${agentId}`);
}

/**
 * 执行 Agent（同步）
 */
export function executeAgentApi(
  agentId: string,
  input: Record<string, any>,
) {
  return requestClient.post<AgentExecuteResult>(
    `/agent/${agentId}/execute`,
    input,
  );
}

/**
 * 执行 Agent（流式 SSE）
 * 返回 EventSource 供前端消费
 */
export function executeAgentStreamApi(
  agentId: string,
  input: Record<string, any>,
  onMessage: (data: string) => void,
  onError?: (error: any) => void,
  onDone?: () => void,
): AbortController {
  const controller = new AbortController();
  const baseURL = (requestClient as any).config?.baseURL ?? '';
  const url = `${baseURL}/agent/${agentId}/executeStream`;

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onDone?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data) {
              onMessage(data);
            }
          }
        }
      }
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError?.(error);
      }
    });

  return controller;
}

/**
 * 切换 Agent 版本
 */
export function switchAgentVersionApi(agentId: string, version: string) {
  return requestClient.post(
    `/agent/${agentId}/version/switch?version=${version}`,
  );
}

/**
 * 删除 Agent
 */
export function deleteAgentApi(agentId: string) {
  return requestClient.post(`/agent/${agentId}`);
}

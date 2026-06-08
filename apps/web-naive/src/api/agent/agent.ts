import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace AgentApi {
  export interface AgentVersion {
    createdAt?: string;
    description?: string;
    graph?: any;
    versionNumber: string;
  }

  export interface AgentDefinition {
    agentId: string;
    createdAt?: string;
    currentVersion?: string;
    description?: string;
    name: string;
    updatedAt?: string;
    versions?: AgentVersion[];
  }

  export interface RegisterAgentRequest {
    agentId: string;
    description?: string;
    graph?: any;
    name: string;
    versionDescription?: string;
    versionNumber?: string;
  }

  export interface ExecuteRequest {
    [key: string]: any;
  }

  export interface ExecuteResponse {
    [key: string]: any;
  }
}

/**
 * 注册 Agent
 */
async function registerAgent(data: AgentApi.RegisterAgentRequest) {
  return requestClient.post<{ agentId: string }>('/api/agent/register', data);
}

/**
 * 获取 Agent 列表
 */
async function getAgentList() {
  return requestClient.get<AgentApi.AgentDefinition[]>('/api/agent/list');
}

/**
 * 获取 Agent 定义
 */
async function getAgent(agentId: string) {
  return requestClient.get<AgentApi.AgentDefinition>(`/api/agent/${agentId}`);
}

/**
 * 删除 Agent
 */
async function deleteAgent(agentId: string) {
  return requestClient.post(`/api/agent/${agentId}`);
}

/**
 * 同步执行 Agent
 */
async function executeAgent(agentId: string, data?: AgentApi.ExecuteRequest) {
  return requestClient.post<AgentApi.ExecuteResponse>(
    `/api/agent/${agentId}/execute`,
    data,
  );
}

/**
 * 流式执行 Agent (SSE)
 */
async function executeAgentStream(
  agentId: string,
  data: AgentApi.ExecuteRequest,
  onMessage: (chunk: string) => void,
): Promise<void> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const response = await fetch(`${baseURL}/api/agent/${agentId}/executeStream`, {
    body: JSON.stringify(data),
    headers: {
      'Accept': 'text/event-stream',
      'Authorization': token ? `Bearer ${token}` : '',
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

/**
 * 切换 Agent 版本
 */
async function switchAgentVersion(agentId: string, version: string) {
  return requestClient.post(`/api/agent/${agentId}/version/switch`, null, {
    params: { version },
  });
}

export {
  deleteAgent,
  executeAgent,
  executeAgentStream,
  getAgent,
  getAgentList,
  registerAgent,
  switchAgentVersion,
};

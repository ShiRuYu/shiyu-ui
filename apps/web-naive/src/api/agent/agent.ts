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
async function executeAgent(agentId: string, data?: Record<string, any>) {
  return requestClient.post<Record<string, any>>(
    `/api/agent/${agentId}/execute`,
    data,
  );
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
  getAgent,
  getAgentList,
  registerAgent,
  switchAgentVersion,
};

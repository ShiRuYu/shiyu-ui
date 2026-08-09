import { requestClient } from '#/api/request';
import { consumeEventStream } from '#/api/stream';

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
 * 注册 Agent（缓存版，供 Graph 引擎内部使用）
 * 对应 AgentDefinitionController: POST /agent/definition/register
 */
async function registerAgent(data: AgentApi.RegisterAgentRequest) {
  return requestClient.post<{ agentId: string }>(
    '/agent/definition/register',
    data,
  );
}

/**
 * 获取 Agent 列表
 * 对应 AgentDefinitionController: GET /agent/definition/list
 */
async function getAgentList() {
  return requestClient.get<AgentApi.AgentDefinition[]>(
    '/agent/definition/list',
  );
}

/**
 * 获取 Agent 定义
 * 对应 AgentDefinitionController: GET /agent/definition/detail/by-agent-id
 */
async function getAgent(agentId: string) {
  return requestClient.get<AgentApi.AgentDefinition>(
    '/agent/definition/detail/by-agent-id',
    {
      params: { agentId },
    },
  );
}

/**
 * 删除 Agent
 * 对应 AgentDefinitionController: POST /agent/definition/delete/by-agent-id
 */
async function deleteAgent(agentId: string) {
  return requestClient.post('/agent/definition/delete/by-agent-id', null, {
    params: { agentId },
  });
}

/**
 * 切换 Agent 版本
 * 对应 AgentDefinitionController: POST /agent/definition/version/switch
 */
async function switchAgentVersion(agentId: string, version: string) {
  return requestClient.post('/agent/definition/version/switch', null, {
    params: { agentId, version },
  });
}

/**
 * 同步执行 Agent（走 ExecutionController，带完整生命周期）
 * 对应 ExecutionController: POST /agent/execution/execute
 */
async function executeAgent(agentId: string, data?: Record<string, any>) {
  return requestClient.post<Record<string, any>>(
    '/agent/execution/execute',
    data,
    {
      params: { agentId },
    },
  );
}

/**
 * 流式执行 Agent (SSE，走 ExecutionController，带完整生命周期)
 * 对应 ExecutionController: POST /agent/execution/execute-stream
 */
async function executeAgentStream(
  agentId: string,
  data: Record<string, any>,
  onMessage: (chunk: string) => void,
  options: { signal?: AbortSignal } = {},
): Promise<void> {
  const { useAccessStore } = await import('@vben/stores');
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const response = await fetch(
    `${baseURL}/agent/execution/execute-stream?agentId=${encodeURIComponent(agentId)}`,
    {
      body: JSON.stringify(data),
      headers: {
        Accept: 'text/event-stream',
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      signal: options.signal,
    },
  );

  await consumeEventStream(
    response,
    ({ data: eventData }) => {
      if (!eventData || eventData === '[DONE]') return;
      try {
        const event = JSON.parse(eventData) as Record<string, any>;
        const payload = event.data ?? event;
        const output =
          payload.output ?? payload.content ?? payload.text ?? payload.delta;
        onMessage(
          typeof output === 'string'
            ? output
            : `${JSON.stringify(payload, null, 2)}\n`,
        );
      } catch {
        onMessage(eventData);
      }
    },
    options.signal,
  );
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

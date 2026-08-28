import { requestClient } from '#/shared/api/request';
import { consumeEventStream } from '#/shared/api/stream';

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

/** Register an Agent definition used by graph and execution flows. */
async function registerAgent(data: AgentApi.RegisterAgentRequest) {
  return requestClient.post<{ agentId: string }>(
    '/api/agent/agents/register',
    data,
  );
}

/** List available Agent definitions. */
async function getAgentList() {
  return requestClient.get<AgentApi.AgentDefinition[]>(
    '/api/agent/agents/list',
  );
}

/** Load one Agent definition by its stable identifier. */
async function getAgent(agentId: string) {
  return requestClient.get<AgentApi.AgentDefinition>(
    '/api/agent/agents/detail/by-agent-id',
    { params: { agentId } },
  );
}

/** Delete one Agent definition. */
async function deleteAgent(agentId: string) {
  return requestClient.post('/api/agent/agents/delete/by-agent-id', null, {
    params: { agentId },
  });
}

/** Switch the active version for an Agent. */
async function switchAgentVersion(agentId: string, version: string) {
  return requestClient.post('/api/agent/agents/version/switch', null, {
    params: { agentId, version },
  });
}

/** Execute an Agent synchronously. */
async function executeAgent(agentId: string, data?: Record<string, any>) {
  return requestClient.post<Record<string, any>>(
    '/api/agent/executions/execute',
    data,
    { params: { agentId } },
  );
}

/** Execute an Agent over SSE and map persisted events to UI text chunks. */
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
    `${baseURL}/api/agent/executions/execute-stream?agentId=${encodeURIComponent(agentId)}`,
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

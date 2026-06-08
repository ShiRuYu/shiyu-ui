import { requestClient } from '#/api/request';

export interface PageResult<T> {
  items: T[];
  total: number;
}

export namespace AgentAdminApi {
  export interface AgentVO {
    id: number;
    agentId: string;
    name: string;
    description: string;
    currentVersion: string;
    status: string;
    createTime: string;
    updateTime: string;
  }

  export interface AgentDetailVO extends AgentVO {
    versions: AgentVersionVO[];
  }

  export interface AgentVersionVO {
    id: number;
    agentId: string;
    versionNumber: string;
    description: string;
    status: string;
    createTime: string;
    updateTime: string;
  }

  export interface AgentRequest {
    agentId: string;
    name: string;
    description?: string;
    status?: string;
  }
}

async function getAgentPage(params: {
  name?: string;
  page: number;
  pageSize: number;
  status?: string;
}) {
  return requestClient.get<PageResult<AgentAdminApi.AgentVO>>(
    '/admin/agent/page',
    { params },
  );
}

async function getAgentById(id: number) {
  return requestClient.get<AgentAdminApi.AgentDetailVO>(`/admin/agent/${id}`);
}

async function createAgent(data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>('/admin/agent', data);
}

async function updateAgent(id: number, data: AgentAdminApi.AgentRequest) {
  return requestClient.patch<AgentAdminApi.AgentVO>(`/admin/agent/${id}`, data);
}

async function deleteAgent(id: number) {
  return requestClient.delete(`/admin/agent/${id}`);
}

async function toggleAgentStatus(id: number, status: string) {
  return requestClient.put(`/admin/agent/${id}/status`, null, {
    params: { status },
  });
}

export {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgentPage,
  toggleAgentStatus,
  updateAgent,
};

import type { Recordable } from '@vben/types';

import type { PageResult } from '#/api/types';

import { requestClient } from '#/api/request';

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

async function getAgentPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<PageResult<AgentAdminApi.AgentVO>>(
    '/agent/admin/list',
    { params: { pageNum: page, pageSize, ...rest } },
  );
}

async function getAgentById(id: number) {
  return requestClient.get<AgentAdminApi.AgentDetailVO>('/agent/admin/detail', {
    params: { id },
  });
}

async function getAgentListAll() {
  return requestClient.get('/agent/admin/options');
}

async function createAgent(data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>('/agent/admin/create', data);
}

async function updateAgent(id: number, data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>('/agent/admin/update', data, { params: { id } });
}

async function deleteAgent(id: number) {
  return requestClient.post('/agent/admin/delete', null, { params: { id } });
}

// async function toggleAgentStatus(id: number, status: string) {
//   return requestClient.put(`/admin/agent/${id}/status`, null, {
//     params: { status },
//   });
// }

export {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgentListAll,
  getAgentPage,
  updateAgent,
};

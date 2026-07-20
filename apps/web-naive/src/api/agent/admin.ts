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

// ========== Agent 定义管理 (AgentDefinitionController: /agent/definition) ==========

/** 分页查询 */
async function getAgentPage(params: {
  name?: string;
  page: number;
  pageSize: number;
  status?: string;
}) {
  return requestClient.get<PageResult<AgentAdminApi.AgentVO>>(
    '/agent/definition/page',
    { params },
  );
}

/** 根据 ID 查询详情 */
async function getAgentById(id: number) {
  return requestClient.get<AgentAdminApi.AgentDetailVO>(
    '/agent/definition/detail',
    {
      params: { id },
    },
  );
}

/** 查询所有 Agent 列表 */
async function getAgentListAll() {
  return requestClient.get('/agent/definition/list');
}

/** 新增 Agent */
async function createAgent(data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>(
    '/agent/definition/create',
    data,
  );
}

/** 修改 Agent */
async function updateAgent(id: number, data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>(
    '/agent/definition/update',
    data,
    {
      params: { id },
    },
  );
}

/** 删除 Agent */
async function deleteAgent(id: number) {
  return requestClient.post('/agent/definition/delete', null, {
    params: { id },
  });
}

/** 切换 Agent 状态 */
async function toggleAgentStatus(id: number, status: string) {
  return requestClient.post('/agent/definition/status', null, {
    params: { id, status },
  });
}

export interface PageResult<T> {
  items: T[];
  total: number;
}

export {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgentListAll,
  getAgentPage,
  toggleAgentStatus,
  updateAgent,
};

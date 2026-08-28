import { requestClient } from '#/shared/api/request';

export namespace AgentAdminApi {
  export interface AgentVO {
    id: number;
    agentId: string;
    name: string;
    description: string;
    currentVersion: string;
    status: number;
    statusDesc?: string;
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
    status: number;
    statusDesc?: string;
    createTime: string;
    updateTime: string;
  }

  export interface AgentRequest {
    agentId: string;
    name: string;
    description?: string;
    status?: number;
  }
}

// ========== Agent 定义管理 (AgentDefinitionController: /api/agent/agents) ==========

/** 分页查询 */
async function getAgentPage(params: {
  name?: string;
  page: number;
  pageSize: number;
  status?: number;
}) {
  return requestClient.get<PageResult<AgentAdminApi.AgentVO>>(
    '/api/agent/agents/page',
    {
      params: {
        name: params.name,
        pageNo: params.page,
        pageSize: params.pageSize,
        status: params.status,
      },
    },
  );
}

/** 根据 ID 查询详情 */
async function getAgentById(id: number) {
  return requestClient.get<AgentAdminApi.AgentDetailVO>(
    '/api/agent/agents/detail',
    {
      params: { id },
    },
  );
}

/** 查询所有 Agent 列表 */
async function getAgentListAll() {
  return requestClient.get('/api/agent/agents/list');
}

/** 新增 Agent */
async function createAgent(data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>(
    '/api/agent/agents/create',
    data,
  );
}

/** 修改 Agent */
async function updateAgent(id: number, data: AgentAdminApi.AgentRequest) {
  return requestClient.post<AgentAdminApi.AgentVO>(
    '/api/agent/agents/update',
    data,
    {
      params: { id },
    },
  );
}

/** 删除 Agent */
async function deleteAgent(id: number) {
  return requestClient.post('/api/agent/agents/delete', null, {
    params: { id },
  });
}

/** 切换 Agent 状态 */
async function toggleAgentStatus(id: number, status: number) {
  return requestClient.post('/api/agent/agents/status', null, {
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

import { requestClient } from '#/api/request';

export namespace AgentVersionApi {
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

  export interface GraphConfigVO {
    name: string;
    description: string;
    startNode: string;
    endNode: string;
    nodes: Record<string, any>;
    edges: Record<string, any>;
    conditionalEdges: Record<string, any>;
  }

  export interface AgentVersionDetailVO extends AgentVersionVO {
    graphConfig: GraphConfigVO;
    canvasConfig: string;
  }

  export interface VersionRequest {
    versionNumber: string;
    description?: string;
    copyFromVersionId?: number;
  }
}

// ========== 版本 + Graph 管理 (AgentVersionController: /agent/version) ==========

/** 获取版本列表 */
async function getVersionList(agentId: string) {
  return requestClient.get<AgentVersionApi.AgentVersionVO[]>(
    '/agent/version/list',
    {
      params: { agentId },
    },
  );
}

/** 获取版本详情 */
async function getVersionDetail(agentId: string, versionId: number) {
  return requestClient.get<AgentVersionApi.AgentVersionDetailVO>(
    '/agent/version/detail',
    { params: { agentId, versionId } },
  );
}

/** 创建版本 */
async function createVersion(
  agentId: string,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionVO>(
    '/agent/version/create',
    data,
    { params: { agentId } },
  );
}

/** 更新版本 */
async function updateVersion(
  agentId: string,
  versionId: number,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionVO>(
    '/agent/version/update',
    data,
    { params: { agentId, versionId } },
  );
}

/** 删除版本 */
async function deleteVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/delete', null, {
    params: { agentId, versionId },
  });
}

/** 发布版本 */
async function publishVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/publish', null, {
    params: { agentId, versionId },
  });
}

/** 归档版本 */
async function archiveVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/archive', null, {
    params: { agentId, versionId },
  });
}

/** 激活版本 */
async function activateVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/activate', null, {
    params: { agentId, versionId },
  });
}

/** 复制版本 */
async function copyVersion(
  agentId: string,
  sourceVersionId: number,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionVO>(
    '/agent/version/copy',
    data,
    { params: { agentId, sourceVersionId } },
  );
}

export {
  activateVersion,
  archiveVersion,
  copyVersion,
  createVersion,
  deleteVersion,
  getVersionDetail,
  getVersionList,
  publishVersion,
  updateVersion,
};

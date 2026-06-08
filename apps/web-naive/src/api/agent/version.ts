import { requestClient } from '#/api/request';

export namespace AgentVersionApi {
  export interface AgentVersionVO {
    id: number;
    agentId: string;
    versionNumber: string;
    description: string;
    status: string;
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

async function getVersionList(agentId: string) {
  return requestClient.get<AgentVersionApi.AgentVersionVO[]>(
    `/admin/agent/${agentId}/version`,
  );
}

async function getVersionDetail(agentId: string, versionId: number) {
  return requestClient.get<AgentVersionApi.AgentVersionDetailVO>(
    `/admin/agent/${agentId}/version/${versionId}`,
  );
}

async function createVersion(
  agentId: string,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionVO>(
    `/admin/agent/${agentId}/version`,
    data,
  );
}

async function updateVersion(
  agentId: string,
  versionId: number,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.patch<AgentVersionApi.AgentVersionVO>(
    `/admin/agent/${agentId}/version/${versionId}`,
    data,
  );
}

async function deleteVersion(agentId: string, versionId: number) {
  return requestClient.delete(
    `/admin/agent/${agentId}/version/${versionId}`,
  );
}

async function publishVersion(agentId: string, versionId: number) {
  return requestClient.post(
    `/admin/agent/${agentId}/version/${versionId}/publish`,
  );
}

async function archiveVersion(agentId: string, versionId: number) {
  return requestClient.post(
    `/admin/agent/${agentId}/version/${versionId}/archive`,
  );
}

async function activateVersion(agentId: string, versionId: number) {
  return requestClient.post(
    `/admin/agent/${agentId}/version/${versionId}/activate`,
  );
}

async function copyVersion(
  agentId: string,
  sourceVersionId: number,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionVO>(
    `/admin/agent/${agentId}/version/${sourceVersionId}/copy`,
    data,
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

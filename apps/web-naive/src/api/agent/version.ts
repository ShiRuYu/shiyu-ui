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
    '/agent/version/list',
    { params: { agentId } },
  );
}

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

async function deleteVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/delete', null, { params: { agentId, versionId } });
}

async function publishVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/publish', null, { params: { agentId, versionId } });
}

async function archiveVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/archive', null, { params: { agentId, versionId } });
}

async function activateVersion(agentId: string, versionId: number) {
  return requestClient.post('/agent/version/activate', null, { params: { agentId, versionId } });
}

async function copyVersion(
  agentId: string,
  sourceVersionId: number,
  data: AgentVersionApi.VersionRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionVO>(
    '/agent/version/copy',
    data,
    { params: { agentId } },
  );
}

export {
  activateVersion,
  archiveVersion,
  copyVersion,
  createVersion,
  deleteVersion,
  getVersionList,
  publishVersion,
};

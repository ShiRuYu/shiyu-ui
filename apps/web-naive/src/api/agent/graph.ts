import { requestClient } from '#/api/request';

import type { AgentVersionApi } from './version';

export namespace AgentGraphApi {
  export interface NodeConfigDTO {
    nodeName: string;
    description?: string;
    nodeType: string;
    enabled?: boolean;
    timeout?: number;
    retryCount?: number;
    retryInterval?: number;
    errorStrategy?: string;
    logLevel?: string;
    properties?: Record<string, any>;
    config?: Record<string, any>;
  }

  export interface ConditionalEdgeDTO {
    defaultTarget: string;
    nodeMappings: Record<string, string>;
    conditionType: string;
  }

  export interface GraphConfigRequest {
    name?: string;
    description?: string;
    startNode?: string;
    endNode?: string;
    nodes: Record<string, AgentGraphApi.NodeConfigDTO>;
    edges: Record<string, string[]>;
    conditionalEdges: Record<string, AgentGraphApi.ConditionalEdgeDTO>;
  }

  export interface NodeConfigRequest {
    nodeId: string;
    nodeName: string;
    nodeType: string;
    description?: string;
    enabled?: boolean;
    timeout?: number;
    retryCount?: number;
    retryInterval?: number;
    errorStrategy?: string;
    logLevel?: string;
    properties?: Record<string, any>;
    config?: Record<string, any>;
  }

  export interface EdgeRequest {
    sourceNodeId: string;
    targetNodeId: string;
    edgeType?: string;
    conditionMappings?: Record<string, string>;
    defaultTarget?: string;
    conditionType?: string;
  }

  export interface GraphValidationVO {
    valid: boolean;
    errors: string[];
    warnings: string[];
  }
}

async function getGraphConfig(agentId: string, versionId: number) {
  return requestClient.get<AgentVersionApi.AgentVersionDetailVO>(
    `/admin/agent/${agentId}/version/${versionId}/graph`,
  );
}

async function updateGraphConfig(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.GraphConfigRequest,
) {
  return requestClient.put<AgentVersionApi.AgentVersionDetailVO>(
    `/admin/agent/${agentId}/version/${versionId}/graph`,
    data,
  );
}

async function validateGraphConfig(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.GraphConfigRequest,
) {
  return requestClient.post<AgentGraphApi.GraphValidationVO>(
    `/admin/agent/${agentId}/version/${versionId}/graph/validate`,
    data,
  );
}

async function addNode(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.NodeConfigRequest,
) {
  return requestClient.post(
    `/admin/agent/${agentId}/version/${versionId}/graph/node`,
    data,
  );
}

async function updateNode(
  agentId: string,
  versionId: number,
  nodeId: string,
  data: AgentGraphApi.NodeConfigRequest,
) {
  return requestClient.put(
    `/admin/agent/${agentId}/version/${versionId}/graph/node/${nodeId}`,
    data,
  );
}

async function deleteNode(
  agentId: string,
  versionId: number,
  nodeId: string,
) {
  return requestClient.delete(
    `/admin/agent/${agentId}/version/${versionId}/graph/node/${nodeId}`,
  );
}

async function addEdge(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.EdgeRequest,
) {
  return requestClient.post(
    `/admin/agent/${agentId}/version/${versionId}/graph/edge`,
    data,
  );
}

async function deleteEdge(
  agentId: string,
  versionId: number,
  sourceNodeId: string,
  targetNodeId: string,
) {
  return requestClient.delete(
    `/admin/agent/${agentId}/version/${versionId}/graph/edge`,
    { params: { sourceNodeId, targetNodeId } },
  );
}

async function getCanvasConfig(agentId: string, versionId: number) {
  return requestClient.get<string>(
    `/admin/agent/${agentId}/version/${versionId}/graph/canvas`,
  );
}

async function updateCanvasConfig(
  agentId: string,
  versionId: number,
  canvasConfig: string,
) {
  return requestClient.put(
    `/admin/agent/${agentId}/version/${versionId}/graph/canvas`,
    canvasConfig,
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export {
  addEdge,
  addNode,
  deleteEdge,
  deleteNode,
  getCanvasConfig,
  getGraphConfig,
  updateCanvasConfig,
  updateGraphConfig,
  updateNode,
  validateGraphConfig,
};

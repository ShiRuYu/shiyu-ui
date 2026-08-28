import type { AgentVersionApi } from './version';

import { requestClient } from '#/shared/api/request';

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

  /** 表单模式下使用的节点数据结构 */
  export interface FormNode {
    id: string;
    nodeName: string;
    nodeType: string;
    enabled: boolean;
    description: string;
    config: Record<string, any>;
    timeout?: number;
    retryCount?: number;
    retryInterval?: number;
    errorStrategy?: string;
    logLevel?: string;
    properties?: Record<string, any>;
  }

  /** 表单模式下使用的连线数据结构 */
  export interface FormEdge {
    id: string;
    source: string;
    target: string;
    edgeType: 'conditional' | 'normal';
    conditionType?: string;
    conditionMapping?: string;
    isDefault?: boolean;
  }
}

// ========== Graph 配置 (AgentVersionController: /api/agent/versions/graph/...) ==========

/** 获取 Graph 配置 */
async function getGraphConfig(agentId: string, versionId: number) {
  return requestClient.get<AgentVersionApi.AgentVersionDetailVO>(
    '/api/agent/versions/graph/detail',
    { params: { agentId, versionId } },
  );
}

/** 更新 Graph 配置 */
async function updateGraphConfig(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.GraphConfigRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionDetailVO>(
    '/api/agent/versions/graph/update',
    data,
    { params: { agentId, versionId } },
  );
}

/** 校验 Graph 配置 */
async function validateGraphConfig(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.GraphConfigRequest,
) {
  return requestClient.post<AgentGraphApi.GraphValidationVO>(
    '/api/agent/versions/graph/validate',
    data,
    { params: { agentId, versionId } },
  );
}

/** 添加节点 */
async function addNode(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.NodeConfigRequest,
) {
  return requestClient.post('/api/agent/versions/graph/node/create', data, {
    params: { agentId, versionId },
  });
}

/** 更新节点 */
async function updateNode(
  agentId: string,
  versionId: number,
  nodeId: string,
  data: AgentGraphApi.NodeConfigRequest,
) {
  return requestClient.post('/api/agent/versions/graph/node/update', data, {
    params: { agentId, versionId, nodeId },
  });
}

/** 删除节点 */
async function deleteNode(agentId: string, versionId: number, nodeId: string) {
  return requestClient.post('/api/agent/versions/graph/node/delete', null, {
    params: { agentId, versionId, nodeId },
  });
}

/** 添加边 */
async function addEdge(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.EdgeRequest,
) {
  return requestClient.post('/api/agent/versions/graph/edge/create', data, {
    params: { agentId, versionId },
  });
}

/** 删除边 */
async function deleteEdge(
  agentId: string,
  versionId: number,
  sourceNodeId: string,
  targetNodeId: string,
) {
  return requestClient.post('/api/agent/versions/graph/edge/delete', null, {
    params: { agentId, versionId, sourceNodeId, targetNodeId },
  });
}

/** 获取画布配置 */
async function getCanvasConfig(agentId: string, versionId: number) {
  return requestClient.get<string>('/api/agent/versions/graph/canvas', {
    params: { agentId, versionId },
  });
}

/** 更新画布配置 */
async function updateCanvasConfig(
  agentId: string,
  versionId: number,
  canvasConfig: string,
) {
  return requestClient.post(
    '/api/agent/versions/graph/canvas-update',
    canvasConfig,
    {
      headers: { 'Content-Type': 'application/json' },
      params: { agentId, versionId },
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

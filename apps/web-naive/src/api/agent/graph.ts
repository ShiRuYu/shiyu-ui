import type { AgentVersionApi } from './version';

import { requestClient } from '#/api/request';

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

async function getGraphConfig(agentId: string, versionId: number) {
  return requestClient.get<AgentVersionApi.AgentVersionDetailVO>(
    '/agent/graph/detail',
    { params: { agentId, versionId } },
  );
}

async function updateGraphConfig(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.GraphConfigRequest,
) {
  return requestClient.post<AgentVersionApi.AgentVersionDetailVO>(
    '/agent/graph/update',
    data,
    { params: { agentId, versionId } },
  );
}

async function validateGraphConfig(
  agentId: string,
  versionId: number,
  data: AgentGraphApi.GraphConfigRequest,
) {
  return requestClient.post<AgentGraphApi.GraphValidationVO>(
    '/agent/graph/validate',
    data,
    { params: { agentId, versionId } },
  );
}

export { getGraphConfig, updateGraphConfig, validateGraphConfig };

import type { AgentGraphApi } from '#/features/agent/api';

export interface ParsedGraphConfig {
  endNode: string;
  formEdges: AgentGraphApi.FormEdge[];
  formNodes: AgentGraphApi.FormNode[];
  startNode: string;
}

/** Convert the persisted graph shape into the editor's node/edge model. */
export function parseGraphConfig(
  config: null | Partial<AgentGraphApi.GraphConfigRequest> | undefined,
): ParsedGraphConfig {
  const formNodes: AgentGraphApi.FormNode[] = [];
  const formEdges: AgentGraphApi.FormEdge[] = [];
  if (!config) return { endNode: '', formEdges, formNodes, startNode: '' };

  for (const [key, value] of Object.entries(config.nodes ?? {})) {
    const node = value as AgentGraphApi.NodeConfigDTO;
    formNodes.push({
      id: key,
      nodeName: node.nodeName || key,
      nodeType: node.nodeType || '',
      enabled: node.enabled !== false,
      description: node.description || '',
      config: node.config || {},
      timeout: node.timeout,
      retryCount: node.retryCount,
      retryInterval: node.retryInterval,
      errorStrategy: node.errorStrategy,
      logLevel: node.logLevel,
      properties: node.properties || {},
    });
  }

  for (const [source, targets] of Object.entries(config.edges ?? {})) {
    for (const target of targets ?? []) {
      formEdges.push({
        id: `${source}->${target}`,
        source,
        target,
        edgeType: 'normal',
      });
    }
  }

  for (const [source, value] of Object.entries(config.conditionalEdges ?? {})) {
    const conditional = value as AgentGraphApi.ConditionalEdgeDTO;
    if (conditional.defaultTarget) {
      formEdges.push({
        id: `${source}->${conditional.defaultTarget}__cond_default`,
        source,
        target: conditional.defaultTarget,
        edgeType: 'conditional',
        conditionType: conditional.conditionType,
        isDefault: true,
      });
    }
    for (const [mapping, target] of Object.entries(
      conditional.nodeMappings ?? {},
    )) {
      formEdges.push({
        id: `${source}->${target}__cond_${mapping}`,
        source,
        target,
        edgeType: 'conditional',
        conditionType: conditional.conditionType,
        conditionMapping: mapping,
        isDefault: false,
      });
    }
  }

  return {
    endNode: config.endNode || '',
    formEdges,
    formNodes,
    startNode: config.startNode || '',
  };
}

/** Convert the editor model back to the persisted graph shape. */
export function buildGraphConfig(
  name: string,
  formNodes: AgentGraphApi.FormNode[],
  formEdges: AgentGraphApi.FormEdge[],
  startNode?: string,
  endNode?: string,
): AgentGraphApi.GraphConfigRequest {
  const nodes: Record<string, AgentGraphApi.NodeConfigDTO> = {};
  for (const node of formNodes) {
    nodes[node.id] = {
      nodeName: node.nodeName || node.id,
      description: node.description || '',
      nodeType: node.nodeType || '',
      enabled: node.enabled !== false,
      timeout: node.timeout,
      retryCount: node.retryCount,
      retryInterval: node.retryInterval,
      errorStrategy: node.errorStrategy,
      logLevel: node.logLevel,
      properties: node.properties || {},
      config: node.config || {},
    };
  }

  const edges: Record<string, string[]> = {};
  const conditionalEdges: Record<string, AgentGraphApi.ConditionalEdgeDTO> = {};
  for (const edge of formEdges) {
    if (edge.edgeType === 'conditional') {
      const conditional = (conditionalEdges[edge.source] ??= {
        conditionType: edge.conditionType || '',
        defaultTarget: '',
        nodeMappings: {},
      });
      if (edge.isDefault) conditional.defaultTarget = edge.target;
      else if (edge.conditionMapping)
        conditional.nodeMappings[edge.conditionMapping] = edge.target;
    } else {
      (edges[edge.source] ??= []).push(edge.target);
    }
  }

  return {
    name,
    nodes,
    edges,
    conditionalEdges,
    startNode: startNode || formNodes[0]?.id || '',
    endNode: endNode || formNodes.at(-1)?.id || '',
  };
}

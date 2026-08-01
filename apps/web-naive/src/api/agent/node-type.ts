import { requestClient } from '#/api/request';

export namespace NodeTypeApi {
  export interface DataSourceConfig {
    type: 'api' | 'dict';
    url?: string;
    dictType?: string;
    labelKey?: string;
    valueKey?: string;
    dependsOn?: string;
  }

  export interface FieldMeta {
    key: string;
    label: string;
    type: string;
    description: string;
    defaultValue?: any;
    required?: boolean;
    options?: Record<string, any>;
    source?: NodeTypeApi.DataSourceConfig | string;
  }

  export interface NodeTypeMetaVO {
    code: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    fields: NodeTypeApi.FieldMeta[];
  }
}

// ========== 节点类型元数据 (AgentDefinitionController: /agent/definition/node-types) ==========

/** 获取所有节点类型 */
async function getNodeTypes() {
  return requestClient.get<NodeTypeApi.NodeTypeMetaVO[]>(
    '/agent/definition/node-types',
  );
}

/** 获取单个节点类型详情 */
async function getNodeType(nodeType: string) {
  return requestClient.get<NodeTypeApi.NodeTypeMetaVO>(
    '/agent/definition/node-types/detail',
    { params: { nodeType } },
  );
}

export { getNodeType, getNodeTypes };

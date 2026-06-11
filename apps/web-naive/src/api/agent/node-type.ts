import { requestClient } from '#/api/request';

export namespace NodeTypeApi {
  export interface FieldMeta {
    key: string;
    label: string;
    type: string;
    description: string;
    defaultValue?: any;
    required?: boolean;
    options?: Record<string, any>;
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

async function getNodeTypes() {
  return requestClient.get<NodeTypeApi.NodeTypeMetaVO[]>(
    '/admin/agent/node-types',
  );
}

async function getNodeType(nodeType: string) {
  return requestClient.get<NodeTypeApi.NodeTypeMetaVO>(
    `/admin/agent/node-types/${nodeType}`,
  );
}

export { getNodeType, getNodeTypes };

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
    source?: NodeTypeApi.DataSourceConfig;
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

export { getNodeTypes };

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ModelApi {
  export interface ModelItem {
    [key: string]: any;
    description?: string;
    displayName?: string;
    id: number;
    isDefault?: string;
    modelConfig?: string;
    modelName: string;
    platformId: number;
    platformName?: string;
    sort?: number;
    status: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getModelPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, platformId, ...rest } = params || {};
  const query: Recordable<any> = { pageNum: page, pageSize, ...rest };
  if (platformId) {
    query.platformId = platformId;
  }
  return requestClient.get<ModelApi.PageResult<ModelApi.ModelItem>>(
    '/agent/model/page',
    { params: query },
  );
}

async function createModel(data: Omit<ModelApi.ModelItem, 'id'>) {
  return requestClient.post('/agent/model', data);
}

async function updateModel(id: number, data: Partial<ModelApi.ModelItem>) {
  return requestClient.patch(`/agent/model/${id}`, data);
}

async function deleteModel(id: number) {
  return requestClient.delete(`/agent/model/${id}`);
}

async function setDefaultModel(id: number) {
  return requestClient.put(`/agent/model/${id}/default`);
}

export { createModel, deleteModel, getModelPage, setDefaultModel, updateModel };

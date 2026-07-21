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
    status: number;
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
  return requestClient.post('/agent/model/create', data);
}

async function updateModel(id: number, data: Partial<ModelApi.ModelItem>) {
  return requestClient.post('/agent/model/update', data, { params: { id } });
}

async function deleteModel(id: number) {
  return requestClient.post('/agent/model/delete', null, { params: { id } });
}

async function setDefaultModel(id: number) {
  return requestClient.post('/agent/model/set-default', null, {
    params: { id },
  });
}

async function batchDeleteModel(ids: number[]) {
  return requestClient.post('/agent/model/batch-delete', ids);
}

export {
  batchDeleteModel,
  createModel,
  deleteModel,
  getModelPage,
  setDefaultModel,
  updateModel,
};

import type { Recordable } from '@vben/types';

import { requestClient } from '#/shared/api/request';

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
    '/api/model/models/page',
    { params: query },
  );
}

async function createModel(data: Omit<ModelApi.ModelItem, 'id'>) {
  return requestClient.post('/api/model/models/create', data);
}

async function updateModel(id: number, data: Partial<ModelApi.ModelItem>) {
  return requestClient.post('/api/model/models/update', data, {
    params: { id },
  });
}

async function deleteModel(id: number) {
  return requestClient.post('/api/model/models/delete', null, {
    params: { id },
  });
}

async function setDefaultModel(id: number) {
  return requestClient.post('/api/model/models/set-default', null, {
    params: { id },
  });
}

async function batchDeleteModel(ids: number[]) {
  return requestClient.post('/api/model/models/batch-delete', ids);
}

export {
  batchDeleteModel,
  createModel,
  deleteModel,
  getModelPage,
  setDefaultModel,
  updateModel,
};

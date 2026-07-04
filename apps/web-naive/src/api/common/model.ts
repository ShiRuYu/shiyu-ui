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
  const query: Recordable<any> = { pageNo: page, pageSize, ...rest };
  if (platformId) {
    query.platformId = platformId;
  }
  return requestClient.get<ModelApi.PageResult<ModelApi.ModelItem>>(
    '/admin/model/page',
    { params: query },
  );
}

async function createModel(data: Omit<ModelApi.ModelItem, 'id'>) {
  return requestClient.post('/admin/model', data);
}

async function updateModel(id: number, data: Partial<ModelApi.ModelItem>) {
  return requestClient.patch(`/admin/model/${id}`, data);
}

async function deleteModel(id: number) {
  return requestClient.delete(`/admin/model/${id}`);
}

async function setDefaultModel(id: number) {
  return requestClient.put(`/admin/model/${id}/default`);
}

export {
  createModel,
  deleteModel,
  getModelPage,
  setDefaultModel,
  updateModel,
};

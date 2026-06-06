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
    '/ai/model/page',
    { params: query },
  );
}

async function getModelsByPlatform(platformId: number) {
  return requestClient.get<ModelApi.ModelItem[]>(
    `/ai/model/platform/${platformId}`,
  );
}

async function getModelById(id: number) {
  return requestClient.get<ModelApi.ModelItem>(`/ai/model/${id}`);
}

async function createModel(data: Omit<ModelApi.ModelItem, 'id'>) {
  return requestClient.post('/ai/model', data);
}

async function updateModel(id: number, data: Partial<ModelApi.ModelItem>) {
  return requestClient.patch(`/ai/model/${id}`, data);
}

async function deleteModel(id: number) {
  return requestClient.delete(`/ai/model/${id}`);
}

async function batchDeleteModels(ids: number[]) {
  return requestClient.delete('/ai/model/batch', { data: ids });
}

async function setDefaultModel(id: number) {
  return requestClient.put(`/ai/model/${id}/default`);
}

export {
  batchDeleteModels,
  createModel,
  deleteModel,
  getModelById,
  getModelPage,
  getModelsByPlatform,
  setDefaultModel,
  updateModel,
};

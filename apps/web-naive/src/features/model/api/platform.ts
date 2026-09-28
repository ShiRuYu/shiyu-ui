import type { Recordable } from '@vben/types';

import { requestClient } from '#/shared/api/request';

export namespace PlatformApi {
  export interface PlatformOption {
    code: string;
    id: number;
    name: string;
  }

  export interface PlatformItem {
    [key: string]: any;
    apiKey?: string;
    adapterType?: 'OLLAMA' | 'OPENAI_COMPATIBLE';
    availableModels?: string;
    baseUrl?: string;
    code: string;
    extraConfig?: string;
    id: number;
    isDefault?: string;
    maxRetries?: number;
    maxTokens?: number;
    name: string;
    remark?: string;
    status: number;
    temperature?: number;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getPlatformPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<PlatformApi.PageResult<PlatformApi.PlatformItem>>(
    '/api/model/platforms',
    { params: { pageNo: page, pageSize, ...rest } },
  );
}

async function createPlatform(data: Omit<PlatformApi.PlatformItem, 'id'>) {
  return requestClient.post('/api/model/platforms', data);
}

async function updatePlatform(
  id: number,
  data: Partial<PlatformApi.PlatformItem>,
) {
  return requestClient.put(`/api/model/platforms/${id}`, data);
}

async function deletePlatform(id: number) {
  return requestClient.delete(`/api/model/platforms/${id}`);
}

async function setDefaultPlatform(id: number) {
  return requestClient.post('/api/model/platforms/set-default', null, {
    params: { id },
  });
}

async function getPlatformOptions() {
  return requestClient.get<PlatformApi.PlatformOption[]>(
    '/api/model/platforms/options',
  );
}

async function reloadPlatforms() {
  return requestClient.post('/api/model/platforms/reload');
}

export {
  createPlatform,
  deletePlatform,
  getPlatformOptions,
  getPlatformPage,
  reloadPlatforms,
  setDefaultPlatform,
  updatePlatform,
};

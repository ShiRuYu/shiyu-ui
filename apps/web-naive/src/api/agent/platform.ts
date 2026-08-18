import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PlatformApi {
  export interface PlatformOption {
    code: string;
    id: number;
    name: string;
  }

  export interface PlatformItem {
    [key: string]: any;
    apiKey?: string;
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
    '/v1/platform/providers/page',
    { params: { pageNum: page, pageSize, ...rest } },
  );
}

async function createPlatform(data: Omit<PlatformApi.PlatformItem, 'id'>) {
  return requestClient.post('/v1/platform/providers/create', data);
}

async function updatePlatform(
  id: number,
  data: Partial<PlatformApi.PlatformItem>,
) {
  return requestClient.post('/v1/platform/providers/update', data, { params: { id } });
}

async function deletePlatform(id: number) {
  return requestClient.post('/v1/platform/providers/delete', null, { params: { id } });
}

async function setDefaultPlatform(id: number) {
  return requestClient.post('/v1/platform/providers/set-default', null, {
    params: { id },
  });
}

async function getPlatformOptions() {
  return requestClient.get<PlatformApi.PlatformOption[]>(
    '/v1/platform/providers/options',
  );
}

async function reloadPlatforms() {
  return requestClient.post('/v1/platform/providers/reload');
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

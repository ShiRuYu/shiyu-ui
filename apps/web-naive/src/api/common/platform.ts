import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace PlatformApi {
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
    status: string;
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
    '/admin/platform/page',
    { params: { pageNum: page, pageSize, ...rest } },
  );
}

async function createPlatform(data: Omit<PlatformApi.PlatformItem, 'id'>) {
  return requestClient.post('/admin/platform', data);
}

async function updatePlatform(
  id: number,
  data: Partial<PlatformApi.PlatformItem>,
) {
  return requestClient.patch(`/admin/platform/${id}`, data);
}

async function deletePlatform(id: number) {
  return requestClient.delete(`/admin/platform/${id}`);
}

async function setDefaultPlatform(id: number) {
  return requestClient.put(`/admin/platform/${id}/default`);
}

async function getPlatformOptions() {
  return requestClient.get<{ id: number; name: string }[]>(
    '/admin/platform/options',
  );
}

async function reloadPlatforms() {
  return requestClient.post('/admin/platform/reload');
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

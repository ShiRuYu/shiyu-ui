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
    '/ai/platform/page',
    { params: { pageNo: page, pageSize, ...rest } },
  );
}

async function getEnabledPlatforms() {
  return requestClient.get<PlatformApi.PlatformItem[]>('/ai/platform/enabled');
}

async function getPlatformById(id: number) {
  return requestClient.get<PlatformApi.PlatformItem>(`/ai/platform/${id}`);
}

async function createPlatform(data: Omit<PlatformApi.PlatformItem, 'id'>) {
  return requestClient.post('/ai/platform', data);
}

async function updatePlatform(
  id: number,
  data: Partial<PlatformApi.PlatformItem>,
) {
  return requestClient.patch(`/ai/platform/${id}`, data);
}

async function deletePlatform(id: number) {
  return requestClient.delete(`/ai/platform/${id}`);
}

async function setDefaultPlatform(id: number) {
  return requestClient.put(`/ai/platform/${id}/default`);
}

async function getPlatformOptions() {
  return requestClient.get<{ id: number; name: string }[]>(
    '/ai/platform/options',
  );
}

async function reloadPlatforms() {
  return requestClient.post('/ai/platform/reload');
}

export {
  createPlatform,
  deletePlatform,
  getEnabledPlatforms,
  getPlatformById,
  getPlatformOptions,
  getPlatformPage,
  reloadPlatforms,
  setDefaultPlatform,
  updatePlatform,
};

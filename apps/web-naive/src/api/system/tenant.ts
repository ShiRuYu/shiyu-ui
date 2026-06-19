import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemTenantApi {
  export interface SystemTenant {
    [key: string]: any;
    id: number;
    code: string;
    name: string;
    contactName?: string;
    contactPhone?: string;
    address?: string;
    domain?: string;
    intro?: string;
    status: string;
    createTime?: string;
    updateTime?: string;
  }
}

async function getTenantList(_params?: Recordable<any>) {
  const data =
    await requestClient.get<SystemTenantApi.SystemTenant[]>('/tenant/all');
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

async function createTenant(
  data: Omit<SystemTenantApi.SystemTenant, 'createTime' | 'id' | 'updateTime'>,
) {
  return requestClient.post('/tenant', data);
}

async function updateTenant(
  id: number,
  data: Omit<SystemTenantApi.SystemTenant, 'createTime' | 'id' | 'updateTime'>,
) {
  return requestClient.patch(`/tenant/${id}`, data);
}

async function deleteTenant(id: number) {
  return requestClient.delete(`/tenant/${id}`);
}

export { createTenant, deleteTenant, getTenantList, updateTenant };

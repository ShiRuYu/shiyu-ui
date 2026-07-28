import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemTenantApi {
  export interface SystemTenant {
    [key: string]: any;
    id: number;
    parentId?: null | number;
    code: string;
    name: string;
    contactName?: string;
    contactPhone?: string;
    address?: string;
    domain?: string;
    intro?: string;
    status: number;
    createTime?: string;
    updateTime?: string;
  }
}

async function getTenantList(_params?: Recordable<any>) {
  const data =
    await requestClient.get<SystemTenantApi.SystemTenant[]>('/tenant/list');
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

async function createTenant(
  data: Omit<SystemTenantApi.SystemTenant, 'createTime' | 'id' | 'updateTime'>,
) {
  return requestClient.post('/tenant/create', data);
}

async function updateTenant(
  id: number,
  data: Omit<SystemTenantApi.SystemTenant, 'createTime' | 'id' | 'updateTime'>,
) {
  return requestClient.post('/tenant/update', data, { params: { id } });
}

async function deleteTenant(id: number) {
  return requestClient.post('/tenant/delete', null, { params: { id } });
}

/** 获取租户选项（构建为树形结构，供 ApiTreeSelect 使用） */
async function getTenantTreeOptions() {
  const data =
    await requestClient.get<SystemTenantApi.SystemTenant[]>('/tenant/list');
  const list = Array.isArray(data) ? data : [];

  // 将平铺的 parentId 结构转换为 children 树结构
  const childrenMap: Record<number, SystemTenantApi.SystemTenant[]> = {};
  const roots: SystemTenantApi.SystemTenant[] = [];

  for (const item of list) {
    const pid = item.parentId;
    if (pid == null) {
      roots.push(item);
    } else {
      if (!childrenMap[pid]) childrenMap[pid] = [];
      childrenMap[pid].push(item);
    }
  }

  function attachChildren(node: SystemTenantApi.SystemTenant) {
    const children = childrenMap[node.id];
    if (children && children.length > 0) {
      node.children = children;
      children.forEach(attachChildren);
    }
  }

  roots.forEach(attachChildren);

  return { items: roots, total: roots.length };
}

export {
  createTenant,
  deleteTenant,
  getTenantList,
  getTenantTreeOptions,
  updateTenant,
};

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemTenantApi {
  export interface SystemTenant {
    [key: string]: any;
    children?: SystemTenant[];
    id: number;
    parentId?: null | number;
    code: string;
    name: string;
    contactName?: string;
    contactPhone?: string;
    address?: string;
    domain?: string;
    intro?: string;
    status: number | string;
    adminPassword?: string;
    adminRoleName?: string;
    adminUsername?: string;
    authCodeIds?: number[];
    menuIds?: number[];
    createTime?: string;
    updateTime?: string;
  }
}

function buildTenantTree(list: SystemTenantApi.SystemTenant[]) {
  const nodes = new Map<number, SystemTenantApi.SystemTenant>();
  const roots: SystemTenantApi.SystemTenant[] = [];

  for (const item of list) {
    nodes.set(item.id, { ...item, children: [] });
  }
  for (const node of nodes.values()) {
    const parent =
      node.parentId === null || node.parentId === undefined
        ? undefined
        : nodes.get(node.parentId);
    if (parent) {
      parent.children?.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function filterTenantTree(
  nodes: SystemTenantApi.SystemTenant[],
  params?: Recordable<any>,
): SystemTenantApi.SystemTenant[] {
  const name = String(params?.name ?? '')
    .trim()
    .toLowerCase();
  const code = String(params?.code ?? '')
    .trim()
    .toLowerCase();
  const status = String(params?.status ?? '').trim();
  if (!name && !code && !status) return nodes;

  return nodes.flatMap((node) => {
    const children = filterTenantTree(node.children ?? [], params);
    const matches =
      (!name || node.name.toLowerCase().includes(name)) &&
      (!code || node.code.toLowerCase().includes(code)) &&
      (!status || String(node.status) === status);
    return matches || children.length > 0 ? [{ ...node, children }] : [];
  });
}

async function getTenantList(params?: Recordable<any>) {
  const data =
    await requestClient.get<SystemTenantApi.SystemTenant[]>('/v1/system/tenants/list');
  const list = Array.isArray(data) ? data : [];
  return {
    items: filterTenantTree(buildTenantTree(list), params),
    total: list.length,
  };
}

async function getTenantPage(params?: Recordable<any>) {
  return requestClient.get<{
    items: SystemTenantApi.SystemTenant[];
    total: number;
  }>('/v1/system/tenants/page', { params });
}

async function createTenant(
  data: Omit<SystemTenantApi.SystemTenant, 'createTime' | 'id' | 'updateTime'>,
) {
  return requestClient.post('/v1/system/tenants/create', data);
}

async function updateTenant(
  id: number,
  data: Omit<SystemTenantApi.SystemTenant, 'createTime' | 'id' | 'updateTime'>,
) {
  return requestClient.post('/v1/system/tenants/update', data, { params: { id } });
}

async function deleteTenant(id: number) {
  return requestClient.post('/v1/system/tenants/delete', null, { params: { id } });
}

/** 获取租户选项（构建为树形结构，供 ApiTreeSelect 使用） */
async function getTenantTreeOptions() {
  return getTenantList();
}

export {
  createTenant,
  deleteTenant,
  getTenantList,
  getTenantPage,
  getTenantTreeOptions,
  updateTenant,
};

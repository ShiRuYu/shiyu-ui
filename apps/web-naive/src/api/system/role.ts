import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface SystemRole {
    [key: string]: any;
    code?: string;
    createTime?: string;
    id: number;
    name: string;
    permissions?: number[];
    remark?: string;
    status: number;
    tenantId?: number;
  }
}

/**
 * 获取角色列表（分页）
 */
async function getRoleList(params?: Recordable<any>) {
  return requestClient.get<{
    items: SystemRoleApi.SystemRole[];
    total: number;
  }>('/v1/system/roles/list', { params });
}

/**
 * 获取所有角色（下拉选择用）
 */
async function getAllRoles(status?: string, tenantId?: number) {
  return requestClient.get<Array<SystemRoleApi.SystemRole>>(
    '/v1/system/roles/all',
    {
      params: { status, tenantId },
    },
  );
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(
  data: Omit<SystemRoleApi.SystemRole, 'createTime' | 'id'>,
) {
  return requestClient.post('/v1/system/roles/create', data);
}

/**
 * 更新角色
 *
 * @param id 角色 ID
 * @param data 角色数据
 */
async function updateRole(
  id: number,
  data: Omit<SystemRoleApi.SystemRole, 'createTime' | 'id'>,
) {
  return requestClient.post('/v1/system/roles/update', data, {
    params: { id },
  });
}

async function replaceRoleMenus(
  id: number,
  tenantId: number,
  menuIds: number[],
) {
  return requestClient.post('/v1/system/roles/menus/replace', menuIds, {
    params: { id, tenantId },
  });
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: number) {
  return requestClient.post('/v1/system/roles/delete', null, {
    params: { id },
  });
}

/**
 * 获取角色详情
 */
async function getRoleDetail(id: number, tenantId: number) {
  return requestClient.get<SystemRoleApi.SystemRole>(
    '/v1/system/roles/detail',
    {
      params: { id, tenantId },
    },
  );
}

export {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleDetail,
  getRoleList,
  replaceRoleMenus,
  updateRole,
};

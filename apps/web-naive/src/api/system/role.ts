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
    status: string;
  }
}

/**
 * 获取角色列表（分页）
 */
async function getRoleList(params?: Recordable<any>) {
  return requestClient.get<{
    items: SystemRoleApi.SystemRole[];
    total: number;
  }>('/admin/role/list', { params });
}

/**
 * 获取所有角色（下拉选择用）
 */
async function getAllRoles(status?: string) {
  return requestClient.get<Array<SystemRoleApi.SystemRole>>('/admin/role', {
    params: { status },
  });
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(
  data: Omit<SystemRoleApi.SystemRole, 'createTime' | 'id'>,
) {
  return requestClient.post('/admin/role', data);
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
  return requestClient.patch(`/admin/role/${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: number) {
  return requestClient.delete(`/admin/role/${id}`);
}

export { createRole, deleteRole, getAllRoles, getRoleList, updateRole };

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
  }>('/role/list', { params });
}

/**
 * 获取所有角色（下拉选择用）
 */
async function getAllRoles(status?: string) {
  return requestClient.get<Array<SystemRoleApi.SystemRole>>('/role/all', {
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
  return requestClient.post('/role/create', data);
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
  return requestClient.post('/role/update', data, { params: { id } });
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: number) {
  return requestClient.post('/role/delete', null, { params: { id } });
}

/**
 * 获取角色详情
 */
async function getRoleDetail(id: number) {
  return requestClient.get<SystemRoleApi.SystemRole>('/role/detail', {
    params: { id },
  });
}

export {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleDetail,
  getRoleList,
  updateRole,
};

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface SystemRole {
    [key: string]: any;
    code?: string;
    id: string;
    name: string;
    permissions: string[];
    remark?: string;
    status: 0 | 1;
  }
}

/**
 * 获取角色列表数据
 */
async function getRoleList(params: Recordable<any>) {
  return requestClient.get('/auth/role/list', {
    params,
  });
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(data: Omit<SystemRoleApi.SystemRole, 'id'>) {
  return requestClient.post('/auth/role/create', data);
}

/**
 * 更新角色
 *
 * @param id 角色 ID
 * @param data 角色数据
 */
async function updateRole(
  id: string,
  data: Omit<SystemRoleApi.SystemRole, 'id'>,
) {
  return requestClient.post(`/auth/role/update?id=${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: string) {
  return requestClient.post(`/auth/role/delete?id=${id}`);
}

/**
 * 获取角色详情
 * @param id 角色 ID
 */
async function getRoleDetail(id: string) {
  return requestClient.get<SystemRoleApi.SystemRole>('/auth/role/detail', {
    params: { id },
  });
}

export { createRole, deleteRole, getRoleDetail, getRoleList, updateRole };

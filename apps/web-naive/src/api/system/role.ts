import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemRoleApi {
  export interface SystemRole {
    [key: string]: any;
    createTime?: string;
    id: number;
    name: string;
    permissions?: string[];
    remark?: string;
    status: 0 | 1;
  }
}

/**
 * 获取角色列表数据（全部）
 */
async function getRoleList(params?: Recordable<any>) {
  return requestClient.get<Array<SystemRoleApi.SystemRole>>('/role', {
    params,
  });
}

/**
 * 创建角色
 * @param data 角色数据
 */
async function createRole(
  data: Omit<SystemRoleApi.SystemRole, 'createTime' | 'id'>,
) {
  return requestClient.post('/role', data);
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
  return requestClient.put(`/role/${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: number) {
  return requestClient.delete(`/role/${id}`);
}

export { createRole, deleteRole, getRoleList, updateRole };

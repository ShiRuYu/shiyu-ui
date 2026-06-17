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
  return requestClient.patch(`/role/${id}`, data);
}

/**
 * 删除角色
 * @param id 角色 ID
 */
async function deleteRole(id: number) {
  return requestClient.delete(`/role/${id}`);
}

/**
 * 分配角色给用户（在指定工作空间）
 * @param id 角色 ID
 * @param userIds 用户 ID 列表
 * @param workspaceId 工作空间 ID
 */
async function assignRoles(id: number, userIds: number[], workspaceId: number) {
  return requestClient.patch(`/role/users/add/${id}`, { userIds, workspaceId });
}

/**
 * 取消分配角色（在指定工作空间）
 * @param id 角色 ID
 * @param userIds 用户 ID 列表
 * @param workspaceId 工作空间 ID
 */
async function removeRoles(id: number, userIds: number[], workspaceId: number) {
  return requestClient.patch(`/role/users/remove/${id}`, { userIds, workspaceId });
}

export { assignRoles, createRole, deleteRole, getRoleList, removeRoles, updateRole };

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    [key: string]: any;
    avatar?: string;
    createTime?: string;
    email?: string;
    id: number;
    nickName?: string;
    password?: string;
    phone?: string;
    postIds?: number[];
    remark?: string;
    roleIds?: number[];
    sex?: string;
    status: number;
    username: string;
  }

  /** 分页返回格式 */
  export interface PageResult<T> {
    items: T[];
    total: number;
    pageNum?: number;
    pageSize?: number;
  }
}

/**
 * 获取用户列表数据（分页）
 */
async function getUserList(params: Recordable<any>) {
  const { page, pageSize, ...restParams } = params;
  const data = await requestClient.get<
    | SystemUserApi.PageResult<SystemUserApi.SystemUser>
    | SystemUserApi.SystemUser[]
  >('/user/list', {
    params: {
      pageNum: page || 1,
      pageSize: pageSize || 10,
      ...restParams,
    },
  });
  if (data && typeof data === 'object' && 'items' in data) {
    return { items: data.items, total: data.total };
  }
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

/**
 * 获取角色列表（用于用户表单中的角色选择）
 */
async function getRolesForUserForm() {
  return requestClient.get<Array<{ code: string; id: number; name: string }>>(
    '/role/all',
  );
}

/**
 * 创建用户
 * @param data 用户数据
 */
async function createUser(
  data: Omit<SystemUserApi.SystemUser, 'createTime' | 'id'>,
) {
  return requestClient.post('/user/create', data);
}

/**
 * 更新用户
 *
 * @param id 用户 ID
 * @param data 用户数据
 */
async function updateUser(
  id: number,
  data: Omit<SystemUserApi.SystemUser, 'createTime' | 'id'>,
) {
  return requestClient.post('/user/update', data, {
    params: { userId: id },
  });
}

/**
 * 删除用户
 * @param id 用户 ID
 */
async function deleteUser(id: number) {
  return requestClient.post('/user/delete', null, {
    params: { userId: id },
  });
}

/**
 * 重置用户密码
 * @param id 用户 ID
 * @param password 新密码
 */
async function resetUserPassword(id: number, password: string) {
  return requestClient.post(
    '/user/password/reset',
    { password },
    { params: { userId: id } },
  );
}

/**
 * 修改密码（校验旧密码）
 * @param id 用户 ID
 * @param oldPassword 旧密码
 * @param newPassword 新密码
 */
async function changePassword(
  id: number,
  oldPassword: string,
  newPassword: string,
) {
  return requestClient.post(
    '/user/password/change',
    {
      oldPassword,
      newPassword,
    },
    { params: { userId: id } },
  );
}

async function getUserOptions() {
  const result = await getUserList({ page: 1, pageSize: 1000 });
  return (result?.items || []).map((u) => ({
    id: u.id,
    nickName: u.nickName || u.username,
  }));
}

export {
  changePassword,
  createUser,
  deleteUser,
  getRolesForUserForm,
  getUserList,
  getUserOptions,
  resetUserPassword,
  updateUser,
};

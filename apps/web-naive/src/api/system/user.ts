import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    [key: string]: any;
    avatar?: string;
    createTime?: string;
    deptId?: number;
    email?: string;
    id: number;
    nickname?: string;
    phone?: string;
    remark?: string;
    roleIds?: number[];
    status: 0 | 1;
    username: string;
  }

  /** 分页返回格式 */
  export interface PageResult<T> {
    records: T[];
    total: number;
    pageNo?: number;
    pageSize?: number;
  }
}

/**
 * 获取用户列表数据（分页）
 */
async function getUserList(params: Recordable<any>) {
  // 后端使用 pageNo 和 pageSize
  const { page, pageSize, ...restParams } = params;
  const data = await requestClient.get<
    | SystemUserApi.PageResult<SystemUserApi.SystemUser>
    | SystemUserApi.SystemUser[]
  >('/user', {
    params: {
      pageNo: page || 1,
      pageSize: pageSize || 10,
      ...restParams,
    },
  });
  // 如果后端返回分页格式 { records, total }
  if (data && typeof data === 'object' && 'records' in data) {
    return { items: data.records, total: data.total };
  }
  // 如果后端直接返回数组
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

/**
 * 创建用户
 * @param data 用户数据
 */
async function createUser(
  data: Omit<SystemUserApi.SystemUser, 'createTime' | 'id'>,
) {
  return requestClient.post('/user', data);
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
  return requestClient.put(`/user/${id}`, data);
}

/**
 * 删除用户
 * @param id 用户 ID
 */
async function deleteUser(id: number) {
  return requestClient.delete(`/user/${id}`);
}

/**
 * 重置用户密码
 * @param id 用户 ID
 * @param password 新密码
 */
async function resetUserPassword(id: number, password: string) {
  return requestClient.put(`/user/${id}/password`, { password });
}

export { createUser, deleteUser, getUserList, resetUserPassword, updateUser };

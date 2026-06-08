import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ProfileApi {
  export interface Profile {
    [key: string]: any;
    avatar?: string;
    birthDate?: string;
    delFlag?: number;
    gender?: number;
    genderLabel?: string;
    id: number;
    name: string;
    status?: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

/**
 * 分页获取档案列表
 */
async function getProfilePage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<ProfileApi.PageResult<ProfileApi.Profile>>(
    '/api/profile/page',
    { params: { pageNo: page, pageSize, ...rest } },
  );
}

/**
 * 根据 ID 获取档案
 */
async function getProfileById(id: number) {
  return requestClient.get<ProfileApi.Profile>(`/api/profile/${id}`);
}

/**
 * 创建档案
 */
async function createProfile(data: Omit<ProfileApi.Profile, 'delFlag' | 'id'>) {
  return requestClient.post<ProfileApi.Profile>('/api/profile', data);
}

/**
 * 更新档案
 */
async function updateProfile(data: ProfileApi.Profile) {
  return requestClient.put<boolean>('/api/profile', data);
}

/**
 * 删除档案
 */
async function deleteProfile(id: number) {
  return requestClient.delete<boolean>(`/api/profile/${id}`);
}

export {
  createProfile,
  deleteProfile,
  getProfileById,
  getProfilePage,
  updateProfile,
};

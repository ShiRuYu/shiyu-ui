import type { Recordable } from '@vben/types';

import { requestClient } from '#/shared/api/request';

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
    '/api/record/profile/list',
    { params: { pageNum: page, pageSize, ...rest } },
  );
}

/**
 * 创建档案
 */
async function createProfile(data: Omit<ProfileApi.Profile, 'delFlag' | 'id'>) {
  return requestClient.post<ProfileApi.Profile>(
    '/api/record/profile/create',
    data,
  );
}

/**
 * 更新档案
 */
async function updateProfile(data: ProfileApi.Profile) {
  return requestClient.post<boolean>('/api/record/profile/update', data, {
    params: { id: data.id },
  });
}

/**
 * 删除档案
 */
async function deleteProfile(id: number) {
  return requestClient.post<boolean>('/api/record/profile/delete', null, {
    params: { id },
  });
}

/**
 * 获取档案下拉选项（id + name）
 */
async function getProfileOptions() {
  const result = await getProfilePage({ page: 1, pageSize: 1000 });
  return (result?.items || []).map((p) => ({ id: p.id, name: p.name }));
}

export {
  createProfile,
  deleteProfile,
  getProfileOptions,
  getProfilePage,
  updateProfile,
};

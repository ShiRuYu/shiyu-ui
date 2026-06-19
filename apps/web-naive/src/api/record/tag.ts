import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace TagApi {
  export interface Tag {
    [key: string]: any;
    id: number;
    name: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getTagPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<TagApi.PageResult<TagApi.Tag>>('/api/tag/page', {
    params: { pageNo: page, pageSize, ...rest },
  });
}

async function getAllTags() {
  return requestClient.get<TagApi.Tag[]>('/api/tag/all');
}

async function getTagById(id: number) {
  return requestClient.get<TagApi.Tag>(`/api/tag/${id}`);
}

async function createTag(data: Omit<TagApi.Tag, 'id'>) {
  return requestClient.post('/api/tag', data);
}

async function updateTag(data: TagApi.Tag) {
  return requestClient.put('/api/tag', data);
}

async function deleteTag(id: number) {
  return requestClient.delete(`/api/tag/${id}`);
}

export { createTag, deleteTag, getAllTags, getTagById, getTagPage, updateTag };

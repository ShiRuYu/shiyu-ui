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
  return requestClient.get<TagApi.PageResult<TagApi.Tag>>('/record/tag/list', {
    params: { pageNum: page, pageSize, ...rest },
  });
}
async function createTag(data: Omit<TagApi.Tag, 'id'>) {
  return requestClient.post('/record/tag/create', data);
}

async function updateTag(data: TagApi.Tag) {
  return requestClient.post('/record/tag/update', data, { params: { id: data.id } });
}

async function deleteTag(id: number) {
  return requestClient.post('/record/tag/delete', null, { params: { id } });
}

export { createTag, deleteTag, getTagPage, updateTag };

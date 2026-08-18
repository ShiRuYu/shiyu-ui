import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace MediaApi {
  export interface Media {
    [key: string]: any;
    id: number;
    recordId: number;
    url: string;
    type: string;
    size?: number;
    duration?: number;
    width?: number;
    height?: number;
    sort?: number;
    bucket?: string;
    objectKey?: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getMediaPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<MediaApi.PageResult<MediaApi.Media>>(
    '/v1/record/media/list',
    {
      params: { pageNum: page, pageSize, ...rest },
    },
  );
}
async function createMedia(data: Omit<MediaApi.Media, 'id'>) {
  return requestClient.post('/v1/record/media/create', data);
}

async function updateMedia(id: number, data: Partial<MediaApi.Media>) {
  return requestClient.post('/v1/record/media/update', data, { params: { id } });
}

async function deleteMedia(id: number) {
  return requestClient.post('/v1/record/media/delete', null, { params: { id } });
}

export { createMedia, deleteMedia, getMediaPage, updateMedia };

import type { Recordable } from '@vben/types';

import { requestClient } from '#/shared/api/request';

export namespace RecordsApi {
  export interface Record {
    [key: string]: any;
    id: number;
    eventId: number;
    content: string;
    mood?: string;
    location?: string;
    weather?: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

async function getRecordPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<RecordsApi.PageResult<RecordsApi.Record>>(
    '/api/record/record/list',
    {
      params: { pageNum: page, pageSize, ...rest },
    },
  );
}
async function createRecord(data: Omit<RecordsApi.Record, 'id'>) {
  return requestClient.post('/api/record/record/create', data);
}

async function updateRecord(data: RecordsApi.Record) {
  return requestClient.post('/api/record/record/update', data, {
    params: { id: data.id },
  });
}

async function deleteRecord(id: number) {
  return requestClient.post('/api/record/record/delete', null, {
    params: { id },
  });
}

async function getRecordOptions() {
  const result = await getRecordPage({ page: 1, pageSize: 1000 });
  return (result?.items || []).map((r) => ({
    id: r.id,
    content: (r.content || '').slice(0, 20),
  }));
}

export {
  createRecord,
  deleteRecord,
  getRecordOptions,
  getRecordPage,
  updateRecord,
};

import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

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
    '/api/record/page',
    {
      params: { pageNo: page, pageSize, ...rest },
    },
  );
}
async function createRecord(data: Omit<RecordsApi.Record, 'id'>) {
  return requestClient.post('/api/record', data);
}

async function updateRecord(data: RecordsApi.Record) {
  return requestClient.put('/api/record', data);
}

async function deleteRecord(id: number) {
  return requestClient.delete(`/api/record/${id}`);
}

export { createRecord, deleteRecord, getRecordPage, updateRecord };

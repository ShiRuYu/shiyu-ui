import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace DictApi {
  export interface DictItem {
    [key: string]: any;
    cssClass?: string;
    delFlag?: number;
    dictLabel: string;
    dictSort?: number;
    dictType: string;
    dictValue: string;
    id: number;
    isDefault?: string;
    listClass?: string;
    remark?: string;
    status: string;
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

/**
 * 分页获取字典列表
 */
async function getDictPage(params?: Recordable<any>) {
  const { page = 1, pageSize = 10, ...rest } = params || {};
  return requestClient.get<DictApi.PageResult<DictApi.DictItem>>('/admin/dict/page', {
    params: { pageNo: page, pageSize, ...rest },
  });
}

/**
 * 根据字典类型获取字典列表
 */
async function getDictByType(dictType: string) {
  return requestClient.get<DictApi.DictItem[]>(`/admin/dict/type/${dictType}`);
}

/**
 * 创建字典
 */
async function createDict(data: Omit<DictApi.DictItem, 'id'>) {
  return requestClient.post('/admin/dict', data);
}

/**
 * 更新字典
 */
async function updateDict(id: number, data: Partial<DictApi.DictItem>) {
  return requestClient.patch(`/dict/${id}`, data);
}

/**
 * 删除字典
 */
async function deleteDict(id: number) {
  return requestClient.delete(`/dict/${id}`);
}

/**
 * 批量删除字典
 */
async function batchDeleteDict(ids: number[]) {
  return requestClient.delete('/admin/dict/batch', { data: ids });
}

export {
  batchDeleteDict,
  createDict,
  deleteDict,
  // getDictById,
  getDictByType,
  getDictPage,
  updateDict,
};

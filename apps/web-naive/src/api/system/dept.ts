import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemDeptApi {
  export interface SystemDept {
    [key: string]: any;
    children?: SystemDept[];
    createTime?: string;
    id: number;
    name: string;
    pid?: number;
    remark?: string;
    status: string;
  }
}

/**
 * 获取部门列表数据
 */
async function getDeptList(params?: Recordable<any>) {
  return requestClient.get<Array<SystemDeptApi.SystemDept>>('/dept/list', {
    params,
  });
}

/**
 * 获取部门列表数据（包装为 vxe-table 格式）
 */
async function getDeptListForGrid(params?: Recordable<any>) {
  const data = await requestClient.get<Array<SystemDeptApi.SystemDept>>(
    '/dept/list',
    { params },
  );
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

/**
 * 创建部门
 * @param data 部门数据
 */
async function createDept(
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'createTime' | 'id'>,
) {
  return requestClient.post('/dept', data);
}

/**
 * 更新部门
 *
 * @param id 部门 ID
 * @param data 部门数据
 */
async function updateDept(
  id: number,
  data: Omit<SystemDeptApi.SystemDept, 'children' | 'createTime' | 'id'>,
) {
  return requestClient.patch(`/dept/${id}`, data);
}

/**
 * 删除部门
 * @param id 部门 ID
 */
async function deleteDept(id: number) {
  return requestClient.delete(`/dept/${id}`);
}

export { createDept, deleteDept, getDeptList, getDeptListForGrid, updateDept };

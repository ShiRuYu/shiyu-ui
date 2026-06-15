import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemWorkspaceApi {
  export interface SystemWorkspace {
    [key: string]: any;
    children?: SystemWorkspace[];
    createTime?: string;
    id: number;
    name: string;
    pid?: number;
    remark?: string;
    status: string;
  }
}

/**
 * 获取工作空间列表数据
 */
async function getWorkspaceList(params?: Recordable<any>) {
  return requestClient.get<Array<SystemWorkspaceApi.SystemWorkspace>>(
    '/workspace/list',
    {
      params,
    },
  );
}

/**
 * 获取工作空间列表数据（包装为 vxe-table 格式）
 */
async function getWorkspaceListForGrid(params?: Recordable<any>) {
  const data = await requestClient.get<
    Array<SystemWorkspaceApi.SystemWorkspace>
  >('/workspace/list', { params });
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

/**
 * 创建工作空间
 * @param data 工作空间数据
 */
async function createWorkspace(
  data: Omit<
    SystemWorkspaceApi.SystemWorkspace,
    'children' | 'createTime' | 'id'
  >,
) {
  return requestClient.post('/workspace', data);
}

/**
 * 更新工作空间
 *
 * @param id 工作空间 ID
 * @param data 工作空间数据
 */
async function updateWorkspace(
  id: number,
  data: Omit<
    SystemWorkspaceApi.SystemWorkspace,
    'children' | 'createTime' | 'id'
  >,
) {
  return requestClient.patch(`/workspace/${id}`, data);
}

/**
 * 删除工作空间
 * @param id 工作空间 ID
 */
async function deleteWorkspace(id: number) {
  return requestClient.delete(`/workspace/${id}`);
}

export {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceList,
  getWorkspaceListForGrid,
  updateWorkspace,
};

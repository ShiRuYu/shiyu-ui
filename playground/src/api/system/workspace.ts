import { requestClient } from '#/api/request';

export namespace SystemWorkspaceApi {
  export interface SystemWorkspace {
    [key: string]: any;
    children?: SystemWorkspace[];
    id: string;
    name: string;
    remark?: string;
    status: 0 | 1;
  }
}

/**
 * 获取工作空间列表数据
 */
async function getWorkspaceList() {
  return requestClient.get<Array<SystemWorkspaceApi.SystemWorkspace>>(
    '/auth/workspace/list',
  );
}

/**
 * 创建工作空间
 * @param data 工作空间数据
 */
async function createWorkspace(
  data: Omit<SystemWorkspaceApi.SystemWorkspace, 'children' | 'id'>,
) {
  return requestClient.post('/auth/workspace/create', data);
}

/**
 * 更新工作空间
 *
 * @param id 工作空间 ID
 * @param data 工作空间数据
 */
async function updateWorkspace(
  id: string,
  data: Omit<SystemWorkspaceApi.SystemWorkspace, 'children' | 'id'>,
) {
  return requestClient.post(`/auth/workspace/update?id=${id}`, data);
}

/**
 * 删除工作空间
 * @param id 工作空间 ID
 */
async function deleteWorkspace(id: string) {
  return requestClient.post(`/auth/workspace/delete?id=${id}`);
}

export { createWorkspace, deleteWorkspace, getWorkspaceList, updateWorkspace };

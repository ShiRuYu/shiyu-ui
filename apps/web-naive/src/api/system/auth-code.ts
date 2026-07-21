import { requestClient } from '#/api/request';

export namespace AuthCodeApi {
  export interface AuthCodeItem {
    id: number;
    code: string;
    name: string;
    roleId: number;
    status: number;
    createTime: string;
  }
}

/** 获取所有权限码 */
async function getAuthCodeList() {
  return requestClient.get<AuthCodeApi.AuthCodeItem[]>('/auth-code/list');
}

/** 创建权限码 */
async function createAuthCode(data: {
  code: string;
  name: string;
  roleId: number;
}) {
  return requestClient.post('/auth-code/create', data);
}

/** 更新权限码 */
async function updateAuthCode(
  id: number,
  data: Partial<AuthCodeApi.AuthCodeItem>,
) {
  return requestClient.post('/auth-code/update', data, { params: { id } });
}

/** 删除权限码 */
async function deleteAuthCode(id: number) {
  return requestClient.post('/auth-code/delete', null, { params: { id } });
}

export { createAuthCode, deleteAuthCode, getAuthCodeList, updateAuthCode };

import { requestClient } from '#/api/request';

export namespace AuthCodeApi {
  export interface AuthCodeItem {
    id: number;
    code: string;
    name: string;
    module: string;
    resource: string;
    action: string;
    status: number;
    createTime: string;
  }

  export interface AuthCodeOption {
    id: number;
    name: string;
    code: string;
    module: string;
    resource: string;
    action: string;
  }
}

/** 获取所有权限码 */
async function getAuthCodeList() {
  return requestClient.get<AuthCodeApi.AuthCodeItem[]>('/auth-code/list');
}

async function getAuthCodePage(params?: Record<string, any>) {
  return requestClient.get<{
    items: AuthCodeApi.AuthCodeItem[];
    total: number;
  }>('/auth-code/page', { params });
}

/** 创建权限码 */
async function createAuthCode(data: { code: string; name: string }) {
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

async function getRoleAuthCodes(roleId: number, scopedTenantId: number) {
  return requestClient.get<string[]>('/auth-code/roles/list', {
    params: { roleId, scopedTenantId },
  });
}

async function getAuthCodeOptions() {
  return requestClient.get<AuthCodeApi.AuthCodeOption[]>('/auth-code/options');
}

async function replaceRoleAuthCodes(
  roleId: number,
  scopedTenantId: number,
  authCodes: string[],
) {
  return requestClient.post('/auth-code/roles/replace', authCodes, {
    params: { roleId, scopedTenantId },
  });
}

export {
  createAuthCode,
  deleteAuthCode,
  getAuthCodeList,
  getAuthCodePage,
  getAuthCodeOptions,
  getRoleAuthCodes,
  replaceRoleAuthCodes,
  updateAuthCode,
};

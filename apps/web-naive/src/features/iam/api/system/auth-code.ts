import { requestClient } from '#/shared/api/request';

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
  return requestClient.get<AuthCodeApi.AuthCodeItem[]>(
    '/api/iam/auth-codes/list',
  );
}

async function getAuthCodePage(params?: Record<string, any>) {
  return requestClient.get<{
    items: AuthCodeApi.AuthCodeItem[];
    total: number;
  }>('/api/iam/auth-codes/page', { params });
}

/** 创建权限码 */
async function createAuthCode(data: { code: string; name: string }) {
  return requestClient.post('/api/iam/auth-codes/create', data);
}

/** 更新权限码 */
async function updateAuthCode(
  id: number,
  data: Partial<AuthCodeApi.AuthCodeItem>,
) {
  return requestClient.post('/api/iam/auth-codes/update', data, {
    params: { id },
  });
}

/** 删除权限码 */
async function deleteAuthCode(id: number) {
  return requestClient.post('/api/iam/auth-codes/delete', null, {
    params: { id },
  });
}

async function getRoleAuthCodes(roleId: number, tenantId: number) {
  return requestClient.get<string[]>('/api/iam/auth-codes/roles/list', {
    params: { roleId, tenantId },
  });
}

async function getAuthCodeOptions() {
  return requestClient.get<AuthCodeApi.AuthCodeOption[]>(
    '/api/iam/auth-codes/options',
  );
}

async function replaceRoleAuthCodes(
  roleId: number,
  tenantId: number,
  authCodes: string[],
) {
  return requestClient.post('/api/iam/auth-codes/roles/replace', authCodes, {
    params: { roleId, tenantId },
  });
}

export {
  createAuthCode,
  deleteAuthCode,
  getAuthCodeList,
  getAuthCodeOptions,
  getAuthCodePage,
  getRoleAuthCodes,
  replaceRoleAuthCodes,
  updateAuthCode,
};

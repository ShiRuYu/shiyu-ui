import { baseRequestClient, requestClient } from '#/api/request';

export interface WorkspaceContextInfo {
  workspaceId: number;
  workspaceName: string;
  roleCode: string;
}

export interface TenantInfo {
  id: number;
  code?: string;
  name: string;
}

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    tenantId?: number;
    tenantName?: string;
    tenants?: TenantInfo[];
    workspaces?: WorkspaceContextInfo[];
  }

  export interface RefreshTokenResult {
    code: number;
    data: string;
    message?: string;
    success: boolean;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/api/auth/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi(accessToken?: string) {
  return baseRequestClient.post('/api/auth/refresh', {
    accessToken,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post(
    '/api/auth/logout',
    {},
    {
      withCredentials: true,
    },
  );
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/api/auth/codes');
}

/**
 * 切换当前角色
 */
export async function switchCurrentRoleApi(roleId: number) {
  return requestClient.patch('/api/auth/current-role', { roleId });
}

/**
 * 切换当前租户
 * 返回租户下的工作空间列表
 */
export async function switchTenantApi(tenantId: number) {
  return requestClient.post<WorkspaceContextInfo[]>('/api/auth/switch-tenant', {
    tenantId,
  });
}

/**
 * 切换当前工作空间
 */
export async function switchWorkspaceApi(workspaceId: number) {
  return requestClient.post('/api/auth/switch-workspace', { workspaceId });
}

/**
 * 获取用户工作空间列表
 */
export async function getUserWorkspacesApi() {
  return requestClient.get<WorkspaceContextInfo[]>('/api/auth/workspaces');
}

/**
 * 获取用户租户列表
 */
export async function getUserTenantsApi() {
  return requestClient.get<TenantInfo[]>('/api/auth/tenants');
}

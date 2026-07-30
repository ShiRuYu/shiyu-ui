import { baseRequestClient, requestClient } from '#/api/request';

export interface TenantInfo {
  id: number;
  code?: string;
  name: string;
  pathName?: string;
}

export namespace AuthApi {
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  export interface LoginResult {
    accessToken: string;
    homeTenantId?: number;
    currentTenantId?: number;
    switchMode?: string;
    tenantName?: string;
    tenants?: TenantInfo[];
  }

  export interface RefreshTokenResult {
    code: number;
    data: string;
    message?: string;
    success: boolean;
  }
}

export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

export async function refreshTokenApi(accessToken?: string) {
  return baseRequestClient.post('/auth/refresh', {
    accessToken,
  });
}

export async function logoutApi() {
  return baseRequestClient.post(
    '/auth/logout',
    {},
    {
      withCredentials: true,
    },
  );
}

export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}

export async function switchCurrentRoleApi(roleId: number) {
  return requestClient.post('/auth/current-role', { roleId });
}

export async function switchTenantApi(tenantId: number) {
  return requestClient.post<{
    tenants: TenantInfo[];
    userInfo: Record<string, any>;
  }>('/auth/switch-tenant', { tenantId });
}

export async function getUserTenantsApi() {
  return requestClient.get<TenantInfo[]>('/auth/tenants');
}

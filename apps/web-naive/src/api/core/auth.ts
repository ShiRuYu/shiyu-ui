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
  return requestClient.post<AuthApi.LoginResult>('/v1/auth/login', data);
}

export async function refreshTokenApi(accessToken?: string) {
  return baseRequestClient.post('/v1/auth/refresh', {
    accessToken,
  });
}

export async function logoutApi() {
  return baseRequestClient.post(
    '/v1/auth/logout',
    {},
    {
      withCredentials: true,
    },
  );
}

export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/v1/auth/codes');
}

export async function switchCurrentRoleApi(roleId: number) {
  return requestClient.post('/v1/auth/current-role', { roleId });
}

export async function switchTenantApi(tenantId: number) {
  return requestClient.post<{
    tenants: TenantInfo[];
    userInfo: Record<string, any>;
  }>('/v1/auth/switch-tenant', { tenantId });
}

export async function getUserTenantsApi() {
  return requestClient.get<TenantInfo[]>('/v1/auth/tenants');
}

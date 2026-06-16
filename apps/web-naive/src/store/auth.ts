import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { notification } from '#/adapter/naive';
import {
  getAccessCodesApi,
  getUserInfoApi,
  getUserTenantsApi,
  getUserWorkspacesApi,
  loginApi,
  logoutApi,
  switchTenantApi,
  switchWorkspaceApi,
} from '#/api';
import { $t } from '#/locales';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);

      // 如果成功获取到 accessToken
      if (loginResult.accessToken) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(loginResult.accessToken);

        // 存储租户信息
        if (loginResult.tenants) {
          userStore.setTenants(loginResult.tenants);
        }
        if (loginResult.tenantId != null) {
          userStore.setCurrentTenant(
            loginResult.tenantId,
            loginResult.tenantName ?? '',
          );
        }

        // 存储工作空间信息
        if (loginResult.workspaces) {
          userStore.setWorkspaces(loginResult.workspaces);
        }

        // 获取用户信息并存储到 accessStore 中
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        // 根据用户 extInfo 还原工作空间信息
        await refreshWorkspaceInfo();

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            content: $t('authentication.loginSuccess'),
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
            duration: 3000,
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  async function refreshWorkspaceInfo() {
    try {
      const [workspaces, tenants] = await Promise.all([
        getUserWorkspacesApi(),
        getUserTenantsApi(),
      ]);
      if (Array.isArray(workspaces)) {
        userStore.setWorkspaces(workspaces);
      }
      if (Array.isArray(tenants)) {
        userStore.setTenants(tenants);
      }
      const extInfo = userStore.userInfo?.extInfo;
      if (extInfo) {
        const parsed =
          typeof extInfo === 'string' ? JSON.parse(extInfo) : extInfo;
        const currentWsId = parsed?.currentWorkspaceId;
        if (currentWsId != null && Array.isArray(workspaces)) {
          const currentWs = workspaces.find(
            (w: any) => w.workspaceId === currentWsId,
          );
          if (currentWs) {
            userStore.setCurrentWorkspace(
              currentWsId,
              currentWs.workspaceName ?? '',
            );
          }
        }
        const currentTid = parsed?.currentTenantId;
        if (currentTid != null && Array.isArray(tenants)) {
          const currentT = tenants.find((t: any) => t.id === currentTid);
          if (currentT) {
            userStore.setCurrentTenant(currentTid, currentT.name ?? '');
          }
        }
      }
    } catch {
      // 忽略错误
    }
  }

  async function switchTenant(tenantId: number) {
    try {
      const workspaces = await switchTenantApi(tenantId);
      const tenant = userStore.tenants.find((t: any) => t.id === tenantId);
      userStore.setCurrentTenant(tenantId, tenant?.name ?? '');
      if (Array.isArray(workspaces)) {
        userStore.setWorkspaces(workspaces);
        userStore.setCurrentWorkspace(null, '');
      }
      await fetchUserInfo();
    } catch (error: any) {
      notification.error({
        content: error?.message ?? '切换租户失败',
        duration: 3000,
      });
      throw error;
    }
  }

  async function switchWorkspace(workspaceId: number) {
    try {
      await switchWorkspaceApi(workspaceId);
      const workspace = userStore.workspaces.find(
        (w: any) => w.workspaceId === workspaceId,
      );
      userStore.setCurrentWorkspace(
        workspaceId,
        workspace?.workspaceName ?? '',
      );
      await fetchUserInfo();
    } catch (error: any) {
      notification.error({
        content: error?.message ?? '切换工作空间失败',
        duration: 3000,
      });
      throw error;
    }
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
    refreshWorkspaceInfo,
    switchTenant,
    switchWorkspace,
  };
});

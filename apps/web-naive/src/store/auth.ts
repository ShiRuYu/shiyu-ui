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
  loginApi,
  logoutApi,
  switchCurrentRoleApi,
  switchTenantApi,
} from '#/features/iam';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const loginLoading = ref(false);

  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const loginResult = await loginApi(params);

      if (loginResult.accessToken) {
        accessStore.setAccessToken(loginResult.accessToken);

        if (loginResult.tenants) userStore.setTenants(loginResult.tenants);
        if (
          loginResult.currentTenantId !== null &&
          loginResult.currentTenantId !== undefined
        ) {
          userStore.setCurrentTenant(
            loginResult.currentTenantId,
            loginResult.tenantName ?? '',
          );
        }
        if (
          loginResult.homeTenantId !== null &&
          loginResult.homeTenantId !== undefined
        ) {
          userStore.setHomeTenant(loginResult.homeTenantId);
        }

        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;
        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess()
            : await router.push(
                userInfo.homePath || preferences.app.defaultHomePath,
              );
        }

        if (userInfo?.realName) {
          notification.success({
            content: '登录成功',
            description: `欢迎回来，${userInfo.realName}`,
            duration: 3000,
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return { userInfo };
  }

  async function logout(redirect = true, requestServer = true) {
    if (requestServer) {
      try {
        await logoutApi(accessStore.accessToken);
      } catch {
        // Ignore logout failures and clear local state.
      }
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 已经在登录页时不能再带 redirect：此时 currentRoute.fullPath 就是登录页本身，
    // 再编码一层会得到「登录页?redirect=编码后的登录页」，下一次又在这个基础上再包一层，
    // 反复登出会让 URL 逐跳变长，且没有上限。
    // On the login page the current route is the login page itself, so carrying it as
    // `redirect` would nest one more encoded layer on every repeat.
    const currentRoute = router.currentRoute.value;
    const alreadyOnLogin = currentRoute.path === LOGIN_PATH;

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query:
        redirect && !alreadyOnLogin
          ? { redirect: encodeURIComponent(currentRoute.fullPath) }
          : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  async function refreshTenantInfo() {
    try {
      const tenants = await getUserTenantsApi();
      if (Array.isArray(tenants)) userStore.setTenants(tenants);
    } catch {
      // Ignore refresh errors.
    }
  }

  async function switchTenant(tenantId: number) {
    try {
      const context = await switchTenantApi(tenantId);
      const tenant = userStore.tenants.find((item) => item.id === tenantId);
      userStore.setCurrentTenant(tenantId, tenant?.name ?? '');
      if (context?.userInfo) userStore.setUserInfo(context.userInfo as any);
      const accessCodes = await getAccessCodesApi();
      accessStore.setAccessCodes(accessCodes);
      await fetchUserInfo();
    } catch (error: any) {
      notification.error({
        content: error?.message ?? '租户切换失败',
        duration: 3000,
      });
      throw error;
    }
  }

  async function switchRole(roleId: number) {
    await switchCurrentRoleApi(roleId);
    const [userInfo, accessCodes] = await Promise.all([
      getUserInfoApi(),
      getAccessCodesApi(),
    ]);
    userStore.setUserInfo(userInfo);
    accessStore.setAccessCodes(accessCodes);
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
    refreshTenantInfo,
    switchRole,
    switchTenant,
  };
});

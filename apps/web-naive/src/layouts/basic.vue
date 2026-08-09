<script lang="ts" setup>
import { computed, nextTick, onMounted, watch } from 'vue';
import { isNavigationFailure, useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { parseExtInfo } from '@vben/utils';

import { $t } from '#/locales';
import { resetRoutes } from '#/router';
import { useAuthStore } from '#/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const menus = computed(() => [
  {
    handler: () => {
      router.push('/profile');
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

const currentRoleName = computed(() => {
  const info = parseExtInfo(userStore.userInfo?.extInfo);
  return info?.currentRole?.roleName ?? '';
});

const currentRoleId = computed(() => {
  const info = parseExtInfo(userStore.userInfo?.extInfo);
  return info?.currentRole?.roleId ?? null;
});

const userRoleList = computed(() => {
  const info = userStore.userInfo;
  if (info && Array.isArray((info as any).roles)) {
    return (info as any).roles.map((r: any) => ({
      id: r.id ?? r.roleId,
      name: r.name ?? r.roleName,
    }));
  }
  return [];
});

async function handleSwitchRole(roleId: number) {
  const currentPath = router.currentRoute.value.fullPath;
  if (!(await prepareContextSwitch())) return;
  try {
    await authStore.switchRole(roleId);
    await refreshAccessContext(currentPath);
  } catch {
    await router.replace(currentPath);
  }
}

async function handleSwitchTenant(tenantId: number) {
  const currentPath = router.currentRoute.value.fullPath;
  if (!(await prepareContextSwitch())) return;
  try {
    await authStore.switchTenant(tenantId);
    await refreshAccessContext(currentPath);
  } catch {
    await router.replace(currentPath);
  }
}

async function prepareContextSwitch(): Promise<boolean> {
  const result = await router.push({
    path: '/profile',
    query: { contextPreparation: Date.now().toString() },
  });
  return !isNavigationFailure(result);
}

async function refreshAccessContext(currentPath: string) {
  resetRoutes();
  accessStore.setAccessMenus([]);
  accessStore.setAccessRoutes([]);
  accessStore.setIsAccessChecked(false);

  // 使用静态个人中心作为过渡路由，触发菜单与动态路由重新生成。
  await router.replace({
    path: '/profile',
    query: { contextRefresh: Date.now().toString() },
  });
  await router.replace(currentPath);
}

async function handleLogout() {
  await authStore.logout(false);
}

async function focusPageHeading() {
  await nextTick();
  const main = document.querySelector<HTMLElement>('main');
  if (main && !main.id) main.id = 'app-main';
  const heading = main?.querySelector<HTMLElement>('h1');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
}

onMounted(() => {
  void focusPageHeading();
  router.afterEach(() => {
    void focusPageHeading();
  });
});

watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
    isDark: isDark.value,
  }),
  async ({ enable, content, isDark: isDarkValue }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <a class="skip-link" href="#app-main">{{ $t('common.skipToContent') }}</a>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar
        :menus
        :text="userStore.userInfo?.realName"
        :description="
          userStore.userInfo?.email ?? userStore.userInfo?.username ?? ''
        "
        :tag-text="currentRoleName || undefined"
        :tenants="userStore.tenants"
        :current-tenant-id="userStore.currentTenantId"
        :roles="userRoleList"
        :current-role-id="currentRoleId"
        @logout="handleLogout"
        @clear-preferences-and-logout="handleLogout"
        @switch-tenant="handleSwitchTenant"
        @switch-role="handleSwitchRole"
      />
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>

<style scoped>
.skip-link {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 9999;
  padding: 0.5rem 0.75rem;
  color: var(--primary-foreground);
  background: hsl(var(--primary));
  border-radius: 0.375rem;
  transform: translateY(-150%);
}

.skip-link:focus {
  transform: translateY(0);
}
</style>

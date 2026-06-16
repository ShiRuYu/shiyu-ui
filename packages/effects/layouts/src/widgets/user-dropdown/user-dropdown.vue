<script setup lang="ts">
import type { Component } from 'vue';

import type { AnyFunction } from '@vben/types';

import { computed, useTemplateRef, watch } from 'vue';

import { useHoverToggle } from '@vben/hooks';
import { Check, LockKeyhole, LogOut, Settings } from '@vben/icons';
import { $t } from '@vben/locales';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore } from '@vben/stores';
import { isWindowsOs } from '@vben/utils';

import { useVbenModal } from '@vben-core/popup-ui';
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  VbenAvatar,
  VbenIcon,
} from '@vben-core/shadcn-ui';

import { useMagicKeys, whenever } from '@vueuse/core';

import { LockScreenModal } from '../lock-screen';
import { Preferences } from '../preferences';

interface Props {
  /**
   * 头像
   */
  avatar?: string;
  /**
   * @zh_CN 描述
   */
  description?: string;
  /**
   * 是否启用快捷键
   */
  enableShortcutKey?: boolean;
  /**
   * 菜单数组
   */
  menus?: Array<{
    handler: AnyFunction;
    icon?: Component | Function | string;
    text: string;
  }>;

  /**
   * 标签文本
   */
  tagText?: string;
  /**
   * 文本
   */
  text?: string;
  /** 触发方式 */
  trigger?: 'both' | 'click' | 'hover';
  /** hover触发时，延迟响应的时间 */
  hoverDelay?: number;
  /** 租户列表 */
  tenants?: Array<{ id: number; name: string }>;
  /** 当前租户ID */
  currentTenantId?: number | null;
  /** 工作空间列表 */
  workspaces?: Array<{ workspaceId: number; workspaceName: string }>;
  /** 当前工作空间ID */
  currentWorkspaceId?: number | null;
  /** 角色列表 */
  roles?: Array<{ id: number; name: string }>;
  /** 当前角色ID */
  currentRoleId?: number | null;
}

defineOptions({
  name: 'UserDropdown',
});

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  currentRoleId: null,
  currentTenantId: null,
  currentWorkspaceId: null,
  description: '',
  enableShortcutKey: true,
  menus: () => [],
  roles: () => [],
  showShortcutKey: true,
  tagText: '',
  tenants: () => [],
  text: '',
  trigger: 'click',
  hoverDelay: 500,
  workspaces: () => [],
});

const emit = defineEmits<{
  clearPreferencesAndLogout: [];
  logout: [];
  switchRole: [roleId: number];
  switchTenant: [tenantId: number];
  switchWorkspace: [workspaceId: number];
}>();

const {
  globalLockScreenShortcutKey,
  globalLogoutShortcutKey,
  preferencesButtonPosition,
} = usePreferences();
const accessStore = useAccessStore();
const [LockModal, lockModalApi] = useVbenModal({
  connectedComponent: LockScreenModal,
});
const [LogoutModal, logoutModalApi] = useVbenModal({
  onConfirm() {
    handleSubmitLogout();
  },
});

const refTrigger = useTemplateRef('refTrigger');
const refContent = useTemplateRef('refContent');
const refPreferences = useTemplateRef('refPreferences');
const [openPopover, hoverWatcher] = useHoverToggle(
  [refTrigger, refContent],
  () => props.hoverDelay,
);

watch(
  () => props.trigger === 'hover' || props.trigger === 'both',
  (val) => {
    if (val) {
      hoverWatcher.enable();
    } else {
      hoverWatcher.disable();
    }
  },
  {
    immediate: true,
  },
);

const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));

const enableLogoutShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLogoutShortcutKey.value;
});

const enableLockScreenShortcutKey = computed(() => {
  return props.enableShortcutKey && globalLockScreenShortcutKey.value;
});

const enableShortcutKey = computed(() => {
  return props.enableShortcutKey && preferences.shortcutKeys.enable;
});

function handleOpenLock() {
  lockModalApi.open();
}

function handleSubmitLock(lockScreenPassword: string) {
  lockModalApi.close();
  accessStore.lockScreen(lockScreenPassword);
}

function handleLogout() {
  // emit
  logoutModalApi.open();
  openPopover.value = false;
}

function handleSubmitLogout() {
  emit('logout');
  logoutModalApi.close();
}

// 设置 - 打开偏好设置抽屉
function handleOpenSettings() {
  refPreferences.value?.open();
}

if (enableShortcutKey.value) {
  const keys = useMagicKeys();
  const logoutKey = keys['Alt+KeyQ'];
  const lockKey = keys['Alt+KeyL'];

  if (logoutKey) {
    whenever(logoutKey, () => {
      if (enableLogoutShortcutKey.value) {
        handleLogout();
      }
    });
  }

  if (lockKey) {
    whenever(lockKey, () => {
      if (enableLockScreenShortcutKey.value) {
        handleOpenLock();
      }
    });
  }
}
</script>

<template>
  <LockModal
    v-if="preferences.widget.lockScreen"
    :avatar="avatar"
    :text="text"
    @submit="handleSubmitLock"
  />

  <LogoutModal
    :cancel-text="$t('common.cancel')"
    :confirm-text="$t('common.confirm')"
    :fullscreen-button="false"
    :title="$t('common.prompt')"
    centered
    content-class="px-8 min-h-10"
    footer-class="border-none mb-3 mr-3"
    header-class="border-none"
  >
    {{ $t('ui.widgets.logoutTip') }}
  </LogoutModal>

  <Preferences
    v-if="preferencesButtonPosition.userDropdown"
    ref="refPreferences"
    :show-button="false"
    @clear-preferences-and-logout="emit('clearPreferencesAndLogout')"
  />

  <DropdownMenu v-model:open="openPopover" :modal="false">
    <DropdownMenuTrigger ref="refTrigger" :disabled="props.trigger === 'hover'">
      <div class="mr-2 ml-1 cursor-pointer rounded-full p-1.5 hover:bg-accent">
        <div class="flex-center hover:text-accent-foreground">
          <VbenAvatar :alt="text" :src="avatar" class="size-8" dot />
        </div>
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="mr-2 min-w-60 p-0 pb-1">
      <div ref="refContent">
        <DropdownMenuLabel class="flex items-center p-3">
          <VbenAvatar
            :alt="text"
            :src="avatar"
            class="size-12"
            dot
            dot-class="bottom-0 right-1 border-2 size-4 bg-green-500"
          />
          <div class="ml-2 w-full">
            <div
              v-if="tagText || text || $slots.tagText"
              class="mb-1 flex items-center text-sm font-medium text-foreground"
            >
              {{ text }}
              <slot name="tagText">
                <Badge
                  v-if="tagText"
                  variant="secondary"
                  class="ml-2 text-green-400"
                >
                  {{ tagText }}
                </Badge>
              </slot>
            </div>
            <div class="text-xs font-normal text-muted-foreground">
              {{ description }}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator v-if="menus?.length || tenants.length || workspaces.length || (roles && roles.length)" />
        <!-- 租户/工作空间/角色切换 -->
        <template v-if="tenants.length">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="mx-1 cursor-pointer rounded-sm py-1 text-sm data-[highlighted]:bg-accent">
              <span class="text-muted-foreground">{{ $t('ui.widgets.tenant.label') }}：</span>
              <span class="flex-1">{{
                tenants.find((t) => t.id === currentTenantId)
                  ?.name ?? $t('ui.widgets.tenant.notSelected')
              }}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent class="min-w-36">
              <DropdownMenuItem
                v-for="t in tenants"
                :key="t.id"
                class="flex cursor-pointer items-center rounded-sm py-1 text-sm"
                :class="{ 'text-green-400': t.id === currentTenantId }"
                @click="emit('switchTenant', t.id)"
              >
                <Check
                  v-if="t.id === currentTenantId"
                  class="mr-2 size-4"
                />
                <span v-else class="mr-2 inline-block size-4" />
                {{ t.name }}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </template>
        <template v-if="workspaces.length">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="mx-1 cursor-pointer rounded-sm py-1 text-sm data-[highlighted]:bg-accent">
              <span class="text-muted-foreground">{{ $t('ui.widgets.workspace.label') }}：</span>
              <span class="flex-1">{{
                workspaces.find((w) => w.workspaceId === currentWorkspaceId)
                  ?.workspaceName ?? $t('ui.widgets.workspace.notSelected')
              }}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent class="min-w-36">
              <DropdownMenuItem
                v-for="w in workspaces"
                :key="w.workspaceId"
                class="flex cursor-pointer items-center rounded-sm py-1 text-sm"
                :class="{ 'text-green-400': w.workspaceId === currentWorkspaceId }"
                @click="emit('switchWorkspace', w.workspaceId)"
              >
                <Check
                  v-if="w.workspaceId === currentWorkspaceId"
                  class="mr-2 size-4"
                />
                <span v-else class="mr-2 inline-block size-4" />
                {{ w.workspaceName }}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </template>
        <template v-if="roles && roles.length">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger class="mx-1 cursor-pointer rounded-sm py-1 text-sm data-[highlighted]:bg-accent">
              <span class="text-muted-foreground">{{ $t('ui.widgets.roleSwitch.label') }}：</span>
              <span class="flex-1">{{
                roles.find((r) => r.id === currentRoleId)?.name ?? tagText
              }}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent class="min-w-36">
              <DropdownMenuItem
                v-for="r in roles"
                :key="r.id"
                class="flex cursor-pointer items-center rounded-sm py-1 text-sm"
                :class="{ 'text-green-400': r.id === currentRoleId }"
                @click="emit('switchRole', r.id)"
              >
                <Check
                  v-if="r.id === currentRoleId"
                  class="mr-2 size-4"
                />
                <span v-else class="mr-2 inline-block size-4" />
                {{ r.name }}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </template>
        <DropdownMenuSeparator v-if="menus?.length" />
        <DropdownMenuItem
          v-for="menu in menus"
          :key="menu.text"
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="menu.handler"
        >
          <VbenIcon :icon="menu.icon" class="mr-2 size-4" />
          {{ menu.text }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-if="preferencesButtonPosition.userDropdown"
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="handleOpenSettings"
        >
          <Settings class="mr-2 size-4" />
          {{ $t('preferences.title') }}
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="preferences.widget.lockScreen"
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="handleOpenLock"
        >
          <LockKeyhole class="mr-2 size-4" />
          {{ $t('ui.widgets.lockScreen.title') }}
          <DropdownMenuShortcut v-if="enableLockScreenShortcutKey">
            {{ altView }} L
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator v-if="preferences.widget.lockScreen" />
        <DropdownMenuItem
          class="mx-1 flex cursor-pointer items-center rounded-sm py-1 leading-8"
          @click="handleLogout"
        >
          <LogOut class="mr-2 size-4" />
          {{ $t('common.logout') }}
          <DropdownMenuShortcut v-if="enableLogoutShortcutKey">
            {{ altView }} Q
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </div>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

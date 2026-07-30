<script setup lang="ts">
import type { Component } from 'vue';

import type { AnyFunction } from '@vben/types';

import { computed, useTemplateRef, watch } from 'vue';

import { useHoverToggle } from '@vben/hooks';
import { Check, LockKeyhole, LogOut, Settings } from '@vben/icons';
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
  avatar?: string;
  description?: string;
  enableShortcutKey?: boolean;
  menus?: Array<{
    handler: AnyFunction;
    icon?: Component | Function | string;
    text: string;
  }>;
  tagText?: string;
  text?: string;
  trigger?: 'both' | 'click' | 'hover';
  hoverDelay?: number;
  tenants?: Array<{ id: number; name: string; pathName?: string }>;
  currentTenantId?: null | number;
  roles?: Array<{ id: number; name: string }>;
  currentRoleId?: null | number;
}

defineOptions({ name: 'UserDropdown' });

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  currentRoleId: null,
  currentTenantId: null,
  description: '',
  enableShortcutKey: true,
  hoverDelay: 500,
  menus: () => [],
  roles: () => [],
  tagText: '',
  tenants: () => [],
  text: '',
  trigger: 'click',
});

const emit = defineEmits<{
  clearPreferencesAndLogout: [];
  logout: [];
  switchRole: [roleId: number];
  switchTenant: [tenantId: number];
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
    emit('logout');
    logoutModalApi.close();
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
  (value) => (value ? hoverWatcher.enable() : hoverWatcher.disable()),
  { immediate: true },
);

const altView = computed(() => (isWindowsOs() ? 'Alt' : '⌥'));
const enableLogoutShortcutKey = computed(
  () => props.enableShortcutKey && globalLogoutShortcutKey.value,
);
const enableLockScreenShortcutKey = computed(
  () => props.enableShortcutKey && globalLockScreenShortcutKey.value,
);

function handleOpenLock() {
  lockModalApi.open();
}

function handleSubmitLock(password: string) {
  lockModalApi.close();
  accessStore.lockScreen(password);
}

function handleLogout() {
  logoutModalApi.open();
  openPopover.value = false;
}

function handleOpenSettings() {
  refPreferences.value?.open();
}

if (props.enableShortcutKey) {
  const keys = useMagicKeys();
  const logoutKey = keys['Alt+KeyQ'];
  const lockKey = keys['Alt+KeyL'];
  if (logoutKey) {
    whenever(logoutKey, () => {
      if (enableLogoutShortcutKey.value) handleLogout();
    });
  }
  if (lockKey) {
    whenever(lockKey, () => {
      if (enableLockScreenShortcutKey.value) handleOpenLock();
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

        <DropdownMenuSeparator
          v-if="menus?.length || tenants.length > 0 || roles.length > 0"
        />

        <template v-if="tenants.length > 0">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              class="mx-1 cursor-pointer rounded-sm py-1 text-sm data-[highlighted]:bg-accent"
            >
              <span class="text-muted-foreground">租户：</span>
              <span class="flex-1">{{
                tenants.find((tenant) => tenant.id === currentTenantId)
                  ?.pathName ??
                tenants.find((tenant) => tenant.id === currentTenantId)?.name ??
                '未选择'
              }}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent class="min-w-36">
              <DropdownMenuItem
                v-for="tenant in tenants"
                :key="tenant.id"
                class="flex cursor-pointer items-center rounded-sm py-1 text-sm"
                :class="{ 'text-green-400': tenant.id === currentTenantId }"
                @click="emit('switchTenant', tenant.id)"
              >
                <Check
                  v-if="tenant.id === currentTenantId"
                  class="mr-2 size-4"
                />
                <span v-else class="mr-2 inline-block size-4"></span>
                {{ tenant.pathName ?? tenant.name }}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </template>

        <template v-if="roles.length > 0">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              class="mx-1 cursor-pointer rounded-sm py-1 text-sm data-[highlighted]:bg-accent"
            >
              <span class="text-muted-foreground">角色：</span>
              <span class="flex-1">{{
                roles.find((role) => role.id === currentRoleId)?.name ?? tagText
              }}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent class="min-w-36">
              <DropdownMenuItem
                v-for="role in roles"
                :key="role.id"
                class="flex cursor-pointer items-center rounded-sm py-1 text-sm"
                :class="{ 'text-green-400': role.id === currentRoleId }"
                @click="emit('switchRole', role.id)"
              >
                <Check v-if="role.id === currentRoleId" class="mr-2 size-4" />
                <span v-else class="mr-2 inline-block size-4"></span>
                {{ role.name }}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </template>

        <DropdownMenuSeparator v-if="menus?.length" />
        <DropdownMenuItem
          v-for="menu in menus"
          :key="menu.text"
          class="mx-1 flex cursor-pointer items-center py-1 leading-8"
          @click="menu.handler"
        >
          <VbenIcon :icon="menu.icon" class="mr-2 size-4" />
          {{ menu.text }}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          v-if="preferencesButtonPosition.userDropdown"
          class="mx-1 flex cursor-pointer items-center py-1 leading-8"
          @click="handleOpenSettings"
        >
          <Settings class="mr-2 size-4" />
          {{ $t('preferences.title') }}
        </DropdownMenuItem>
        <DropdownMenuItem
          v-if="preferences.widget.lockScreen"
          class="mx-1 flex cursor-pointer items-center py-1 leading-8"
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
          class="mx-1 flex cursor-pointer items-center py-1 leading-8"
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

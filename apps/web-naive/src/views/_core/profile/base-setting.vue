<script setup lang="ts">
import type { RoleInfo } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';
import { parseExtInfo } from '@vben/utils';

import { message } from '#/adapter/naive';
import { getUserInfoApi, switchCurrentRoleApi } from '#/api';
import {
  getTimezone,
  getTimezoneOptions,
  setTimezone,
} from '#/api/common/timezone';
import { updateUser } from '#/api/system/user';
import { useAuthStore } from '#/store';

const profileBaseSettingRef = ref();
const userStore = useUserStore();
const authStore = useAuthStore();

const lastLoginInfo = ref<Record<string, any>>({});
const userRoles = ref<RoleInfo[]>([]);
const selectedRoleId = ref<null | number>(null);

const selectedTenantId = ref<null | number>(null);
const selectedWorkspaceId = ref<null | number>(null);

const timezoneOptions = ref<{ label: string; value: string }[]>([]);
const selectedTimezone = ref('');

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'nickName',
      component: 'Input',
      label: '昵称',
    },
    {
      fieldName: 'username',
      component: 'Input',
      label: '用户名',
    },
    {
      fieldName: 'email',
      component: 'Input',
      label: '邮箱',
    },
  ];
});

async function handleUpdateProfile(values: Record<string, any>) {
  try {
    const userInfo = userStore.userInfo ?? (await getUserInfoApi());
    const userId = userInfo.userId;
    if (userId === null || userId === undefined) {
      message.error('获取用户信息失败');
      return;
    }
    await updateUser(userId, {
      nickName: values.nickName,
      email: values.email,
    });
    message.success('基本信息已更新');
  } catch (error: any) {
    message.error(error?.response?.message ?? error?.message ?? '更新失败');
  }
}

async function switchRole() {
  if (selectedRoleId.value == null) return;
  const target = userRoles.value.find(
    (r: RoleInfo) => r.id === selectedRoleId.value,
  );
  if (!target) return;
  try {
    await switchCurrentRoleApi(target.id);
    const data = await getUserInfoApi();
    userStore.setUserInfo(data);
    message.success(`已切换到角色: ${target.name}`);
  } catch {
    message.error('切换角色失败');
  }
}

async function switchTenant() {
  if (selectedTenantId.value == null) return;
  try {
    await authStore.switchTenant(selectedTenantId.value);
    selectedWorkspaceId.value = null;
    message.success('租户切换成功');
  } catch (error: any) {
    message.error(error?.message ?? '切换租户失败');
  }
}

async function switchWorkspace() {
  if (selectedWorkspaceId.value == null) return;
  try {
    await authStore.switchWorkspace(selectedWorkspaceId.value);
    message.success('工作空间切换成功');
  } catch (error: any) {
    message.error(error?.message ?? '切换工作空间失败');
  }
}

async function loadTimezone() {
  try {
    timezoneOptions.value = (await getTimezoneOptions()) || [];
    const current = await getTimezone();
    if (current) selectedTimezone.value = current;
  } catch {
    // ignore
  }
}

async function switchTimezone() {
  if (!selectedTimezone.value) return;
  try {
    await setTimezone(selectedTimezone.value);
    message.success('时区已更新');
  } catch {
    message.error('时区更新失败');
  }
}

onMounted(async () => {
  try {
    const data = await getUserInfoApi();
    userStore.setUserInfo(data);
    const formValues: Record<string, any> = {
      nickName: data.nickName ?? data.realName,
      username: data.username,
      email: data.email,
    };
    if (Array.isArray(data.roles)) {
      userRoles.value = data.roles;
      const currentCode = lastLoginInfo.value.currentRole?.roleKey;
      const matched = currentCode
        ? data.roles.find((r: RoleInfo) => r.code === currentCode)
        : data.roles[0];
      selectedRoleId.value = matched?.id ?? data.roles[0]?.id;
    }
    profileBaseSettingRef.value.getFormApi().setValues(formValues);
    if (data.extInfo) {
      lastLoginInfo.value = parseExtInfo(data.extInfo);
      const currentCode = lastLoginInfo.value.currentRole?.roleKey;
      if (currentCode && Array.isArray(data.roles)) {
        const matched = data.roles.find(
          (r: RoleInfo) => r.code === currentCode,
        );
        if (matched) selectedRoleId.value = matched.id;
      }
    }

    // 加载租户和工作空间
    selectedTenantId.value = userStore.currentTenantId;
    selectedWorkspaceId.value = userStore.currentWorkspaceId;

    // 加载时区
    await loadTimezone();

    // 刷新工作空间和租户列表
    try {
      await authStore.refreshWorkspaceInfo();
      selectedTenantId.value = userStore.currentTenantId;
      selectedWorkspaceId.value = userStore.currentWorkspaceId;
    } catch {
      // 忽略
    }
  } catch (error: any) {
    message.error(error?.message ?? '获取用户信息失败');
  }
});
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleUpdateProfile"
  />

  <!-- 租户/工作空间/角色切换 -->
  <div class="p-3 rounded-md bg-card mt-3 space-y-3">
    <h4 class="text-sm font-medium">空间与角色</h4>

    <!-- 租户 -->
    <div v-if="userStore.tenants.length > 0" class="flex items-center gap-2">
      <span class="w-16 shrink-0 text-xs text-muted-foreground">当前租户</span>
      <select
        v-model="selectedTenantId"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option v-for="t in userStore.tenants" :key="t.id" :value="t.id">
          {{ t.name }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        @click="switchTenant"
      >
        切换
      </button>
    </div>

    <!-- 工作空间 -->
    <div v-if="userStore.workspaces.length > 0" class="flex items-center gap-2">
      <span class="w-16 shrink-0 text-xs text-muted-foreground">工作空间</span>
      <select
        v-model="selectedWorkspaceId"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option
          v-for="w in userStore.workspaces"
          :key="w.workspaceId"
          :value="w.workspaceId"
        >
          {{ w.workspaceName }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        @click="switchWorkspace"
      >
        切换
      </button>
    </div>

    <!-- 角色 -->
    <div v-if="userRoles.length > 0" class="flex items-center gap-2">
      <span class="w-16 shrink-0 text-xs text-muted-foreground">当前角色</span>
      <select
        v-model="selectedRoleId"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option v-for="r in userRoles" :key="r.id" :value="r.id">
          {{ r.name }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        @click="switchRole"
      >
        切换
      </button>
    </div>
  </div>

  <!-- 时区设置 -->
  <div class="p-3 rounded-md bg-card mt-3 space-y-3">
    <h4 class="text-sm font-medium">时区设置</h4>
    <div class="flex items-center gap-2">
      <span class="w-16 shrink-0 text-xs text-muted-foreground">时区</span>
      <select
        v-model="selectedTimezone"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option
          v-for="opt in timezoneOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        @click="switchTimezone"
      >
        保存
      </button>
    </div>
  </div>

  <!-- 上次登录信息 -->
  <div
    v-if="lastLoginInfo.lastLoginTime || lastLoginInfo.currentRole"
    class="p-3 mt-3 rounded-md bg-card"
  >
    <h4 class="text-sm font-medium mb-2 text-gray-500">上次登录信息</h4>
    <div class="space-y-1 text-xs text-gray-400">
      <div v-if="lastLoginInfo.lastLoginTime">
        登录时间：{{ lastLoginInfo.lastLoginTime }}
      </div>
      <div v-if="lastLoginInfo.lastLoginIp">
        登录IP：{{ lastLoginInfo.lastLoginIp }}
      </div>
      <div v-if="lastLoginInfo.currentRole?.roleName">
        当前角色：{{ lastLoginInfo.currentRole.roleName }}
      </div>
    </div>
  </div>
</template>

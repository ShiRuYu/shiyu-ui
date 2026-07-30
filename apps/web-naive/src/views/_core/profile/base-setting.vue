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
const timezoneOptions = ref<{ label: string; value: string }[]>([]);
const selectedTimezone = ref('');

const formSchema = computed((): VbenFormSchema[] => [
  { fieldName: 'nickName', component: 'Input', label: '昵称' },
  { fieldName: 'username', component: 'Input', label: '用户名' },
  { fieldName: 'email', component: 'Input', label: '邮箱' },
]);

async function handleUpdateProfile(values: Record<string, any>) {
  try {
    const userInfo = userStore.userInfo ?? (await getUserInfoApi());
    const userId = userInfo.userId;
    if (userId === null || userId === undefined) {
      message.error('获取用户信息失败');
      return;
    }
    await updateUser(Number(userId), {
      nickName: values.nickName,
      email: values.email,
    });
    message.success('基本信息已更新');
  } catch (error: any) {
    message.error(error?.response?.message ?? error?.message ?? '更新失败');
  }
}

async function switchRole() {
  if (selectedRoleId.value === null) return;
  const target = userRoles.value.find(
    (role: RoleInfo) => role.id === selectedRoleId.value,
  );
  if (!target) return;
  try {
    await switchCurrentRoleApi(target.id);
    setTimeout(() => window.location.reload(), 100);
    message.success(`已切换到角色: ${target.name}`);
  } catch {
    message.error('角色切换失败');
  }
}

async function switchTenant() {
  if (selectedTenantId.value === null) return;
  try {
    await authStore.switchTenant(selectedTenantId.value);
    setTimeout(() => window.location.reload(), 100);
    message.success('租户切换成功');
  } catch (error: any) {
    message.error(error?.message ?? '租户切换失败');
  }
}

async function loadTimezone() {
  try {
    timezoneOptions.value = (await getTimezoneOptions()) || [];
    selectedTimezone.value = (await getTimezone()) || '';
  } catch {
    // Ignore timezone loading errors.
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
    const data = (await getUserInfoApi()) as any;
    userStore.setUserInfo(data);
    profileBaseSettingRef.value.getFormApi().setValues({
      nickName: data.nickName ?? data.realName,
      username: data.username,
      email: data.email,
    });

    if (Array.isArray(data.roles)) {
      userRoles.value = data.roles as RoleInfo[];
      selectedRoleId.value = userRoles.value[0]?.id ?? null;
    }
    if (data.extInfo) {
      lastLoginInfo.value = parseExtInfo(data.extInfo);
      const roleKey = lastLoginInfo.value.currentRole?.roleKey;
      const role = (data.roles as RoleInfo[] | undefined)?.find(
        (item) => item.code === roleKey,
      );
      if (role) selectedRoleId.value = role.id;
    }

    selectedTenantId.value = userStore.currentTenantId;
    await authStore.refreshTenantInfo();
    selectedTenantId.value = userStore.currentTenantId;
    await loadTimezone();
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

  <div class="mt-3 space-y-3 rounded-md bg-card p-3">
    <h4 class="text-sm font-medium">租户与角色</h4>

    <div v-if="userStore.tenants.length > 0" class="flex items-center gap-2">
      <span class="w-20 shrink-0 text-xs text-muted-foreground">当前租户</span>
      <select
        v-model="selectedTenantId"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option
          v-for="tenant in userStore.tenants"
          :key="tenant.id"
          :value="tenant.id"
        >
          {{ tenant.pathName ?? tenant.name }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        @click="switchTenant"
      >
        切换
      </button>
    </div>

    <div v-if="userRoles.length > 0" class="flex items-center gap-2">
      <span class="w-20 shrink-0 text-xs text-muted-foreground">当前角色</span>
      <select
        v-model="selectedRoleId"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option v-for="role in userRoles" :key="role.id" :value="role.id">
          {{ role.name }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        @click="switchRole"
      >
        切换
      </button>
    </div>
  </div>

  <div class="mt-3 space-y-3 rounded-md bg-card p-3">
    <h4 class="text-sm font-medium">时区设置</h4>
    <div class="flex items-center gap-2">
      <span class="w-20 shrink-0 text-xs text-muted-foreground">时区</span>
      <select
        v-model="selectedTimezone"
        class="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
      >
        <option
          v-for="option in timezoneOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <button
        class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground"
        @click="switchTimezone"
      >
        保存
      </button>
    </div>
  </div>
</template>

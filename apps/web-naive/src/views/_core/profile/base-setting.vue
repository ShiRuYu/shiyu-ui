<script setup lang="ts">
import type { RoleInfo } from '@vben/types';
import type { VbenFormSchema } from '#/adapter/form';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { getUserInfoApi, switchCurrentRoleApi } from '#/api';
import { updateUser } from '#/api/system/user';
import { message } from '#/adapter/naive';
import { parseExtInfo } from '@vben/utils';

const profileBaseSettingRef = ref();
const userStore = useUserStore();

const lastLoginInfo = ref<Record<string, any>>({});
const userRoles = ref<RoleInfo[]>([]);
const selectedRoleId = ref<number | null>(null);

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
  } catch (e: any) {
    message.error(e?.response?.message ?? e?.message ?? '更新失败');
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
  } catch (e: any) {
    message.error(e?.message ?? '获取用户信息失败');
  }
});
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleUpdateProfile"
  />

  <!-- 角色切换 -->
  <div class="p-4 rounded-md bg-card mt-4">
    <h4 class="text-sm font-medium mb-2">当前角色</h4>
    <div class="flex items-center gap-2">
      <select
        v-if="userRoles.length > 0"
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

  <!-- 上次登录信息 -->
  <div
    v-if="lastLoginInfo.lastLoginTime || lastLoginInfo.currentRole"
    class="p-4 border-t border-gray-200 dark:border-gray-700 mt-4 rounded-md bg-card"
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

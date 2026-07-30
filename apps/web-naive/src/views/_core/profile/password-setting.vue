<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { message } from '#/adapter/naive';
import { getUserInfoApi } from '#/api';
import { changePassword } from '#/api/system/user';

const userStore = useUserStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'oldPassword',
      label: '旧密码',
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: '请输入旧密码',
      },
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  try {
    const userInfo = userStore.userInfo ?? (await getUserInfoApi());
    const userId = Number(userInfo.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      message.error('获取用户信息失败');
      return;
    }
    await changePassword(userId, values.oldPassword, values.newPassword);
    message.success('密码修改成功');
  } catch (error: any) {
    message.error(error?.response?.message ?? error?.message ?? '密码修改失败');
  }
}
</script>
<template>
  <ProfilePasswordSetting
    class="w-full sm:w-3/4 md:w-1/2 lg:w-1/3"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>

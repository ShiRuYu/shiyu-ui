<script lang="ts" setup>
import type { SystemUserApi } from '#/features/iam/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';
import { useUserStore } from '@vben/stores';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createUser, updateUser } from '#/features/iam/api';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const userStore = useUserStore();
const formData = ref<SystemUserApi.SystemUser>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.user.name')])
    : $t('ui.actionTitle.create', [$t('system.user.name')]);
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.reset();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal<SystemUserApi.SystemUser>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        const tenantId = formData.value?.tenantId ?? userStore.currentTenantId;
        if (tenantId === null || tenantId === undefined) {
          throw new Error('无法确定当前租户，请重新登录后重试');
        }
        const submitData: SystemUserApi.UserCommand = { ...data, tenantId };
        // 确保 status 是字符串类型
        if (submitData.status !== undefined) {
          submitData.status = String(submitData.status);
        }
        // 确保 gender 是字符串类型
        if (submitData.gender !== undefined) {
          submitData.gender = String(submitData.gender);
        }
        // 编辑时如果没有修改 password 则删除该字段
        if (submitData.id && !submitData.password) {
          delete submitData.password;
        }
        await (formData.value?.id
          ? updateUser(formData.value.id, submitData)
          : createUser(submitData));
        message.success(
          formData.value?.id
            ? $t('ui.actionMessage.editSuccess', [$t('system.user.name')])
            : $t('ui.actionMessage.createSuccess', [$t('system.user.name')]),
        );
        modalApi.close();
        emit('success');
      } catch (error) {
        console.error(error);
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      formApi.reset();
      if (data) {
        formData.value = data;
        formApi.setValues({
          ...data,
          gender:
            data.gender === null || data.gender === undefined
              ? '2'
              : String(data.gender),
          nickName: data.nickName ?? '',
          status:
            data.status === null || data.status === undefined
              ? '1'
              : String(data.status),
        });
      } else {
        formData.value = undefined;
        formApi.setValues({
          nickName: '',
          password: '',
          gender: '2',
          status: '1',
        });
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="resetForm">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

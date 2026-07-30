<script lang="ts" setup>
import type { SystemUserApi } from '#/api/system/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createUser, updateUser } from '#/api/system/user';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
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
  formApi.resetForm();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        const submitData = { ...data };
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
      const data = modalApi.getData<SystemUserApi.SystemUser>();
      formApi.resetForm();
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

<script lang="ts" setup>
import type { SystemRoleApi } from '#/features/iam/api';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { useUserStore } from '@vben/stores';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createRole, updateRole } from '#/features/iam/api';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemRoleApi.SystemRole>();
const userStore = useUserStore();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.role.name')])
    : $t('ui.actionTitle.create', [$t('system.role.name')]);
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1',
  schema: useSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.reset();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal<SystemRoleApi.SystemRole>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        const submitData = { ...data };
        if (submitData.status !== undefined) {
          submitData.status = String(submitData.status);
        }
        // Role commands must carry an explicit tenant. Existing records keep
        // their owner; new records use the authenticated tenant selected in
        // the application shell and fail closed when it is unavailable.
        submitData.tenantId ??=
          formData.value?.tenantId ?? userStore.currentTenantId;
        if (submitData.tenantId === null || submitData.tenantId === undefined) {
          throw new Error('无法确定当前租户，请重新登录后重试');
        }
        await (formData.value?.id
          ? updateRole(formData.value.id, submitData)
          : createRole(submitData));
        message.success(
          formData.value?.id
            ? $t('ui.actionMessage.editSuccess', [$t('system.role.name')])
            : $t('ui.actionMessage.createSuccess', [$t('system.role.name')]),
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
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      formApi.reset();
      formData.value =
        data?.id !== undefined && data?.id !== null ? data : undefined;
      if (data?.id !== undefined && data?.id !== null) {
        formApi.setValues({
          ...data,
          status:
            data.status === null || data.status === undefined
              ? '1'
              : String(data.status),
        });
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[92vw] max-w-[640px]">
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

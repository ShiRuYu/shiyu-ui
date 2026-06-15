<script lang="ts" setup>
import type { SystemWorkspaceApi } from '#/api/system/workspace';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createWorkspace, updateWorkspace } from '#/api/system/workspace';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemWorkspaceApi.SystemWorkspace>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.workspace.name')])
    : $t('ui.actionTitle.create', [$t('system.workspace.name')]);
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
        // 处理 pid 为 0 或 null 的情况
        const submitData = { ...data };
        if (!submitData.pid || submitData.pid === 0) {
          submitData.pid = undefined;
        }

        await (formData.value?.id
          ? updateWorkspace(formData.value.id, submitData)
          : createWorkspace(submitData));
        message.success(
          formData.value?.id
            ? $t('ui.actionMessage.editSuccess', [$t('system.workspace.name')])
            : $t('ui.actionMessage.createSuccess', [
                $t('system.workspace.name'),
              ]),
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
      const data = modalApi.getData<SystemWorkspaceApi.SystemWorkspace>();
      if (data) {
        // 处理 pid 为 0 的情况（number 类型）
        if (data.pid === 0) {
          data.pid = undefined;
        }
        formData.value = data;
        formApi.setValues(formData.value);
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

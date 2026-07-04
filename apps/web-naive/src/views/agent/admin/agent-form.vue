<script lang="ts" setup>
import type { AgentAdminApi } from '#/api/agent/admin';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createAgent, updateAgent } from '#/api/agent/admin';
import { $t } from '#/locales';

import { useSchema } from './data';

const emit = defineEmits(['success']);
const formData = ref<AgentAdminApi.AgentVO>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('agent.adminFormEdit')
    : $t('agent.adminFormCreate');
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
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
        if (submitData.status !== undefined) {
          submitData.status = String(submitData.status);
        }
        await (formData.value?.id
          ? updateAgent(formData.value.id, submitData)
          : createAgent(submitData));
        message.success($t('agent.adminFormSuccess'));
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
      const data = modalApi.getData<AgentAdminApi.AgentVO>();
      formApi.resetForm();
      formData.value = data?.id ? data : undefined;
      await nextTick();
      if (data?.id) {
        formApi.setValues(data);
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[640px]">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="resetForm">
          {{ $t('agent.adminFormReset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

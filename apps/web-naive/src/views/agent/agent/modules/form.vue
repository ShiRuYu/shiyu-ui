<script lang="ts" setup>
import type { AgentApi } from '#/api/agent/agent';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { registerAgent } from '#/api/agent/agent';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<AgentApi.AgentDefinition>();

const getTitle = computed(() => {
  return formData.value?.agentId
    ? $t('ui.actionTitle.edit', [$t('agent.name')])
    : $t('ui.actionTitle.create', [$t('agent.name')]);
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1',
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
        await registerAgent(data);
        message.success($t('ui.actionMessage.operationSuccess'));
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
      const data = modalApi.getData<AgentApi.AgentDefinition>();
      formApi.resetForm();
      formData.value = data?.agentId ? data : undefined;
      await nextTick();
      if (data?.agentId) {
        formApi.setValues({
          agentId: data.agentId,
          name: data.name,
          description: data.description,
          versionNumber: data.currentVersion || 'v1.0.0',
        });
        formApi.updateSchema([
          { componentProps: { disabled: true }, fieldName: 'agentId' },
        ]);
      } else {
        formApi.updateSchema([
          { componentProps: { disabled: false }, fieldName: 'agentId' },
        ]);
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
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

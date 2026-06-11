<script lang="ts" setup>
import type { AgentAdminApi } from '#/api/agent/admin';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createAgent, updateAgent } from '#/api/agent/admin';

import { useSchema } from './data';

const emit = defineEmits(['success']);
const formData = ref<AgentAdminApi.AgentVO>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑 Agent' : '新增 Agent';
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
        message.success('操作成功');
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
        <NButton type="error" @click="resetForm"> 重置 </NButton>
      </div>
    </template>
  </Modal>
</template>

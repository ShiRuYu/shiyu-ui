<script lang="ts" setup>
import type { IntentDefApi } from '#/api/agent/intent-def';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createIntentDef, updateIntentDef } from '#/api/agent/intent-def';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<IntentDefApi.IntentDefVO>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑意图定义' : '新增意图定义';
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

function resetForm() {
  formApi.reset();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal<IntentDefApi.IntentDefVO>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = (await formApi.getValues()) as IntentDefApi.IntentDefRequest;
      try {
        await (formData.value?.id
          ? updateIntentDef(formData.value.id, data)
          : createIntentDef(data));
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
  async onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const data = modalApi.getData();
      formApi.reset();
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
  <Modal :title="getTitle" class="w-[92vw] max-w-[640px]">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="resetForm"> 重置 </NButton>
      </div>
    </template>
  </Modal>
</template>

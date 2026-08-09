<script lang="ts" setup>
import type { ModelApi } from '#/api/agent/model';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createModel, updateModel } from '#/api/agent/model';
import { getPlatformOptions } from '#/api/agent/platform';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ModelApi.ModelItem>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.model.name')])
    : $t('ui.actionTitle.create', [$t('system.model.name')]);
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

const [Modal, modalApi] = useVbenModal<ModelApi.ModelItem>({
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
          ? updateModel(formData.value.id, submitData)
          : createModel(submitData));
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
      const data = modalApi.getData();
      formApi.reset();
      formData.value = data?.id ? data : undefined;
      await nextTick();
      if (data?.id) {
        formApi.setValues(data);
      } else {
        const options = await getPlatformOptions();
        if (options?.[0]) {
          formApi.setFieldValue('platformId', options[0].id);
        }
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

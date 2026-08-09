<script lang="ts" setup>
import type { RecordsApi } from '#/api/record/records';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createRecord, updateRecord } from '#/api/record/records';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<RecordsApi.Record>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('record.records.name')])
    : $t('ui.actionTitle.create', [$t('record.records.name')]),
);
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1',
  schema: useSchema(),
  showDefaultActions: false,
});
const [Modal, modalApi] = useVbenModal<RecordsApi.Record>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        await (formData.value?.id
          ? updateRecord({ ...formData.value, ...data })
          : createRecord(data));
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
      if (data?.id) formApi.setValues(data);
    }
  },
});
</script>
<template>
  <Modal :title="getTitle" class="w-[640px]">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="formApi.reset()">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

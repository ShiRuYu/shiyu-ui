<script lang="ts" setup>
import type { TagApi } from '#/api/record/tag';
import { computed, nextTick, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { NButton } from 'naive-ui';
import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createTag, updateTag } from '#/api/record/tag';
import { $t } from '#/locales';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<TagApi.Tag>();
const getTitle = computed(() => formData.value?.id ? $t('ui.actionTitle.edit', [$t('record.tag.name')]) : $t('ui.actionTitle.create', [$t('record.tag.name')]));
const [Form, formApi] = useVbenForm({ layout: 'vertical', wrapperClass: 'grid-cols-1', schema: useSchema(), showDefaultActions: false });
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock(); const data = await formApi.getValues();
      try { await (formData.value?.id ? updateTag({ ...formData.value, ...data }) : createTag(data)); message.success($t('ui.actionMessage.operationSuccess')); modalApi.close(); emit('success'); }
      catch (error) { console.error(error); } finally { modalApi.lock(false); }
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) { const data = modalApi.getData<TagApi.Tag>(); formApi.resetForm(); formData.value = data?.id ? data : undefined; await nextTick(); if (data?.id) formApi.setValues(data); }
  },
});
</script>
<template>
  <Modal :title="getTitle" class="w-[640px]">
    <Form class="mx-4" />
    <template #prepend-footer><div class="flex-auto"><NButton type="error" @click="formApi.resetForm()">{{ $t('common.reset') }}</NButton></div></template>
  </Modal>
</template>

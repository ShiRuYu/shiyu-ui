<script lang="ts" setup>
import type { EducationResourceApi } from '#/api/education-admin/resource';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createResource, updateResource } from '#/api/education-admin/resource';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<EducationResourceApi.Resource>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('education.resource.name')])
    : $t('ui.actionTitle.create', [$t('education.resource.name')]),
);
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
});
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        await (formData.value?.id
          ? updateResource(formData.value.id, data)
          : createResource(data));
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
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<EducationResourceApi.Resource>();
      formApi.resetForm();
      formData.value = data?.id ? data : undefined;
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
        <NButton type="error" @click="formApi.resetForm()">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

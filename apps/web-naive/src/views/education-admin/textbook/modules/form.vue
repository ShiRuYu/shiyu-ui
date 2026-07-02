<script lang="ts" setup>
import type { EducationTextbookApi } from '#/api/education/textbook';
import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { NButton } from 'naive-ui';
import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createTextbook, updateTextbook } from '#/api/education/textbook';
import { $t } from '#/locales';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<EducationTextbookApi.Textbook>();
const getTitle = computed(() => formData.value?.id ? $t('ui.actionTitle.edit', [$t('education.textbook.name')]) : $t('ui.actionTitle.create', [$t('education.textbook.name')]));
const [Form, formApi] = useVbenForm({ layout: 'vertical', schema: useSchema(), showDefaultActions: false });
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        await (formData.value?.id ? updateTextbook(formData.value.id, data) : createTextbook(data));
        message.success($t('ui.actionMessage.operationSuccess'));
        modalApi.close();
        emit('success');
      } catch (error) { console.error(error); } finally { modalApi.lock(false); }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<EducationTextbookApi.Textbook>();
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
        <NButton type="error" @click="formApi.resetForm()">{{ $t('common.reset') }}</NButton>
      </div>
    </template>
  </Modal>
</template>

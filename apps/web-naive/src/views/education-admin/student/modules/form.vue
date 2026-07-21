<script lang="ts" setup>
import type { EducationStudentApi } from '#/api/education-admin/student';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createStudent, updateStudent } from '#/api/education-admin/student';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<EducationStudentApi.Student>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('education.student.name')])
    : $t('ui.actionTitle.create', [$t('education.student.name')]),
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
          ? updateStudent(
              formData.value.id,
              data as EducationStudentApi.StudentRequest,
            )
          : createStudent(data as EducationStudentApi.StudentRequest));
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
      const data = modalApi.getData<EducationStudentApi.Student>();
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

<script lang="ts" setup>
import type { EducationPlanApi } from '#/api/education/plan';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createPlan, updatePlan } from '#/api/education/plan';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<EducationPlanApi.StudyPlan>();
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('education.plan.name')])
    : $t('ui.actionTitle.create', [$t('education.plan.name')]),
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
      // 格式化日期: DatePicker 返回时间戳，转换为 yyyy-MM-dd 字符串
      if (data.startDate && typeof data.startDate === 'number') {
        const d = new Date(data.startDate);
        data.startDate = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      }
      if (data.endDate && typeof data.endDate === 'number') {
        const d = new Date(data.endDate);
        data.endDate = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
      }
      try {
        await (formData.value?.id
          ? updatePlan(formData.value.id, data)
          : createPlan(data));
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
      const data = modalApi.getData<EducationPlanApi.StudyPlan>();
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

<script lang="ts" setup>
import type { ReviewTaskApi } from '#/api';

import { nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { completeReview } from '#/api';
import { $t } from '#/locales';

const emits = defineEmits(['success']);

const formData = ref<ReviewTaskApi.ReviewTask>();

const [Form, formApi] = useVbenForm({
  schema: () => [
    {
      component: 'InputNumber',
      fieldName: 'resultScore',
      label: $t('education.reviewTask.resultScore'),
      rules: 'required',
      componentProps: {
        min: 0,
        max: 100,
        style: { width: '100%' },
      },
    },
  ],
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    completeReview(formData.value!.id, { resultScore: values.resultScore })
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },

  async onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
      formData.value = drawerApi.getData<ReviewTaskApi.ReviewTask>();
      await nextTick();
    }
  },
});
</script>
<template>
  <Drawer :title="$t('education.reviewTask.completed')">
    <Form />
  </Drawer>
</template>

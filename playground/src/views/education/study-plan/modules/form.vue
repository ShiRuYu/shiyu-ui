<script lang="ts" setup>
import type { StudyPlanApi } from '#/api';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { message, Modal } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { createPlan, updatePlan } from '#/api';
import { $t } from '#/locales';

import { useFormSchema } from '../data';

const emits = defineEmits(['success']);

const formData = ref<StudyPlanApi.StudyPlan>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

const id = ref<number>();
const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    (id.value
      ? updatePlan(id.value, values)
      : createPlan(values)
    )
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
      const data = drawerApi.getData<StudyPlanApi.StudyPlan>();
      formApi.resetForm();
      if (data) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
      }
      await nextTick();
      if (data) {
        formApi.setValues(data);
      }
    }
  },
});

const getDrawerTitle = computed(() => {
  return formData.value?.id
    ? $t('common.edit', [$t('education.studyPlan.title')])
    : $t('common.create', [$t('education.studyPlan.title')]);
});
</script>
<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>

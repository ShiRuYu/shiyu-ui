<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import {
  createKnowledgePoint,
  updateKnowledgePoint,
  type KnowledgePointPayload,
} from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const knowledgeStore = useKnowledgeStore();
const formData = ref<any>();
const difficultyOptions = computed(
  () =>
    knowledgeStore.difficultyScale?.levels.map((level) => ({
      label: `${level.level} · ${level.label}`,
      value: level.level,
    })) ?? [
      { label: '1', value: 1 },
      { label: '2', value: 2 },
      { label: '3', value: 3 },
      { label: '4', value: 4 },
      { label: '5', value: 5 },
    ],
);
const getTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('knowledge.name')])
    : $t('ui.actionTitle.create', [$t('knowledge.name')]),
);
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(difficultyOptions.value),
  showDefaultActions: false,
});
const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      try {
        const data = (await formApi.getValues()) as KnowledgePointPayload;
        if (formData.value?.id) {
          await updateKnowledgePoint(formData.value.id, {
            code: data.code,
            name: data.name,
            description: data.description,
            category: data.category,
            tags: data.tags,
            difficultyLevel: data.difficultyLevel,
          });
        } else if (knowledgeStore.activeSpaceId) {
          await createKnowledgePoint(knowledgeStore.activeSpaceId, {
            ...data,
            difficultyLevel: data.difficultyLevel,
          });
        }
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
      if (!knowledgeStore.spaces.length) {
        await knowledgeStore.loadSpaces();
      }
      const data = modalApi.getData<any>();
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

<script lang="ts" setup>
import type { EducationChapterApi } from '#/api/education/chapter';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import {
  createChapter,
  getChapterKnowledgeIds,
  replaceChapterKnowledgeIds,
  updateChapter,
} from '#/api/education/chapter';
import { $t } from '#/locales';

import { useSchema } from '../data';
const emit = defineEmits(['success']);
const formData = ref<EducationChapterApi.Chapter>();
const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('education.chapter.name')])
    : $t('ui.actionTitle.create', [$t('education.chapter.name')]);
});
const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
});
const [Modal, modalApi] = useVbenModal<EducationChapterApi.Chapter>({
  async onConfirm() {
    const r = await formApi.validate();
    if (r.valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      const kIds = data.knowledgeIds || [];
      delete data.knowledgeIds;
      try {
        if (formData.value?.id) {
          await updateChapter(formData.value.id, data);
          await replaceChapterKnowledgeIds(formData.value.id, kIds);
        } else {
          const result = await createChapter(data);
          if (result?.id) {
            await replaceChapterKnowledgeIds(result.id, kIds);
          }
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
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      formApi.reset();
      formData.value = data?.id ? data : undefined;
      if (data?.id) {
        formApi.setValues(data);
        getChapterKnowledgeIds(data.id)
          .then((knowledgeIds) => {
            formApi.setValues({ knowledgeIds });
          })
          .catch(() => {});
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
        <NButton type="error" @click="formApi.reset()">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

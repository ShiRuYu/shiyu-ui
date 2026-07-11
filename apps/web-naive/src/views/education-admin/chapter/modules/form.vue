<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createChapter, updateChapter } from '#/api/education/chapter';
import { $t } from '#/locales';

import { useSchema } from '../data';
var emit = defineEmits(['success']);
var formData = ref();
var getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('education.chapter.name')])
    : $t('ui.actionTitle.create', [$t('education.chapter.name')]);
});
var [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(),
  showDefaultActions: false,
});
var [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    var r = await formApi.validate();
    if (r.valid) {
      modalApi.lock();
      var data = await formApi.getValues();
      var kIds = data.knowledgeIds || [];
      delete data.knowledgeIds;
      try {
        if (formData.value?.id) {
          await updateChapter(formData.value.id, data);
          if (kIds.length > 0) {
            await fetch(
              '/edu/chapter/knowledge/bind?chapterId=' + formData.value.id,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(kIds),
              },
            );
          }
        } else {
          var result = await createChapter(data);
          if (kIds.length > 0 && result?.id) {
            await fetch('/edu/chapter/knowledge/bind?chapterId=' + result.id, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(kIds),
            });
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
      var data = modalApi.getData();
      formApi.resetForm();
      formData.value = data?.id ? data : undefined;
      if (data?.id) {
        formApi.setValues(data);
        fetch('/edu/chapter/knowledge/list?chapterId=' + data.id)
          .then((r) => {
            return r.json();
          })
          .then((res) => {
            if (res?.data) formApi.setValues({ knowledgeIds: res.data });
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
        <NButton type="error" @click="formApi.resetForm()">
{{
          $t('common.reset')
        }}
</NButton>
      </div>
</template>
  </Modal>
</template>

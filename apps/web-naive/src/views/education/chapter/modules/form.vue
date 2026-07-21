<script setup lang="ts">
import { ref } from 'vue';

import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
} from 'naive-ui';

import {
  createChapterApi,
  getChapterByTextbookApi,
  updateChapterApi,
} from '#/api/education/chapter';

const emit = defineEmits(['success']);
const visible = ref(false);
const formData = ref<any>({
  textbookId: null as null | number,
  parentId: null as null | number,
  name: '',
  chapterOrder: 0,
});
const isEdit = ref(false);
const saving = ref(false);
const parentOptions = ref<Array<{ label: string; value: number }>>([]);

async function loadParentOptions(textbookId: number) {
  try {
    const res = await getChapterByTextbookApi(textbookId);
    parentOptions.value = [
      { label: '无（根节点）', value: null as any },
      ...(res || []).map((c: any) => ({ label: c.name, value: c.id })),
    ];
  } catch {
    parentOptions.value = [{ label: '无（根节点）', value: null as any }];
  }
}

function open(row?: any, textbookId?: null | number) {
  isEdit.value = !!row;
  if (row) {
    formData.value = { ...row };
  } else {
    formData.value = {
      textbookId: textbookId || null,
      parentId: null,
      name: '',
      chapterOrder: 0,
    };
  }
  visible.value = true;
  if (formData.value.textbookId) {
    loadParentOptions(formData.value.textbookId);
  }
}

async function handleSubmit() {
  saving.value = true;
  try {
    const data = {
      ...formData.value,
      parentId: formData.value.parentId || null,
    };
    if (isEdit.value) {
      await updateChapterApi(formData.value.id, data);
    } else {
      await createChapterApi(data);
    }
    visible.value = false;
    emit('success');
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <NModal
    v-model:show="visible"
    title="章节"
    :mask-closable="false"
    preset="card"
    style="width: 600px"
  >
    <NForm :model="formData" label-placement="left" label-width="80">
      <NFormItem
        label="名称"
        path="name"
        :rule="{ required: true, message: '请输入名称' }"
      >
        <NInput v-model:value="formData.name" placeholder="章节名称" />
      </NFormItem>
      <NFormItem label="父级章节">
        <NSelect
          v-model:value="formData.parentId"
          :options="parentOptions"
          placeholder="请选择父级章节"
        />
      </NFormItem>
      <NFormItem label="排序">
        <NInputNumber
          v-model:value="formData.chapterOrder"
          :min="0"
          style="width: 100%"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="saving" @click="handleSubmit">
          保存
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

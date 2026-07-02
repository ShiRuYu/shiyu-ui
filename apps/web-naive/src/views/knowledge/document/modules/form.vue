<script setup lang="ts">
import { ref } from 'vue';

import {
  NButton,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
} from 'naive-ui';

import { getKnowledgeListApi } from '#/api/knowledge';
import { createDocumentApi, updateDocumentApi } from '#/api/knowledge/document';

const emit = defineEmits(['success']);
const visible = ref(false);
const formData = ref<any>({
  title: '',
  content: '',
  docType: 'ARTICLE',
  source: '',
  author: '',
  knowledgeIds: [],
});
const isEdit = ref(false);
const saving = ref(false);
const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const docTypeOptions = [
  { label: '文章 (ARTICLE)', value: 'ARTICLE' },
  { label: '教材 (TEXTBOOK)', value: 'TEXTBOOK' },
  { label: '讲义 (LECTURE)', value: 'LECTURE' },
  { label: '参考 (REFERENCE)', value: 'REFERENCE' },
];

async function open(row?: any, defaultKnowledgeId?: number) {
  isEdit.value = !!row;
  const list = await getKnowledgeListApi();
  knowledgeOptions.value = (list || []).map((k: any) => ({
    label: `[${k.code}] ${k.name}`,
    value: k.id,
  }));

  if (row) {
    formData.value = { ...row, knowledgeIds: row.knowledgeIds || [] };
  } else {
    formData.value = {
      title: '',
      content: '',
      docType: 'ARTICLE',
      source: '',
      author: '',
      knowledgeIds: defaultKnowledgeId ? [defaultKnowledgeId] : [],
    };
  }
  visible.value = true;
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateDocumentApi(formData.value.id, formData.value);
    } else {
      await createDocumentApi(formData.value);
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
    title="文档"
    :mask-closable="false"
    preset="card"
    style="width: 700px"
  >
    <NForm :model="formData" label-placement="left" label-width="80">
      <NFormItem
        label="标题"
        path="title"
        :rule="{ required: true, message: '请输入标题' }"
      >
        <NInput v-model:value="formData.title" placeholder="文档标题" />
      </NFormItem>
      <NFormItem label="类型">
        <NSelect v-model:value="formData.docType" :options="docTypeOptions" />
      </NFormItem>
      <NFormItem label="关联知识点">
        <NSelect
          v-model:value="formData.knowledgeIds"
          :options="knowledgeOptions"
          multiple
          filterable
          placeholder="选择关联知识点"
        />
      </NFormItem>
      <NFormItem label="来源">
        <NInput v-model:value="formData.source" placeholder="来源" />
      </NFormItem>
      <NFormItem label="作者">
        <NInput v-model:value="formData.author" placeholder="作者" />
      </NFormItem>
      <NFormItem
        label="内容"
        path="content"
        :rule="{ required: true, message: '请输入内容' }"
      >
        <NInput
          v-model:value="formData.content"
          type="textarea"
          rows="8"
          placeholder="文档内容"
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

<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSwitch, NButton, NSpace } from 'naive-ui';
import { createKnowledgeApi, updateKnowledgeApi } from '#/api/knowledge';

const visible = ref(false);
const formData = ref<any>({
  code: '',
  name: '',
  category: '',
  difficulty: 2,
  tags: '',
  description: '',
  status: 1,
});
const isEdit = ref(false);
const saving = ref(false);
const emit = defineEmits(['success']);

function open(row?: any) {
  isEdit.value = !!row;
  if (row) {
    formData.value = { ...row };
  } else {
    formData.value = { code: '', name: '', category: '', difficulty: 2, tags: '', description: '', status: 1 };
  }
  visible.value = true;
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateKnowledgeApi(formData.value.id, formData.value);
    } else {
      await createKnowledgeApi(formData.value);
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
  <NModal v-model:show="visible" title="知识点" :mask-closable="false" preset="card" style="width:600px">
    <NForm :model="formData" label-placement="left" label-width="80">
      <NFormItem label="编码" path="code" :rule="{ required: true, message: '请输入编码' }">
        <NInput v-model:value="formData.code" placeholder="如 math_algebra" :disabled="isEdit" />
      </NFormItem>
      <NFormItem label="名称" path="name" :rule="{ required: true, message: '请输入名称' }">
        <NInput v-model:value="formData.name" placeholder="知识点名称" />
      </NFormItem>
      <NFormItem label="分类">
        <NInput v-model:value="formData.category" placeholder="如 MATH" />
      </NFormItem>
      <NFormItem label="难度">
        <NInputNumber v-model:value="formData.difficulty" :min="1" :max="4" style="width:100%" />
      </NFormItem>
      <NFormItem label="标签">
        <NInput v-model:value="formData.tags" placeholder='JSON数组，如 ["代数","函数"]' />
      </NFormItem>
      <NFormItem label="描述">
        <NInput v-model:value="formData.description" type="textarea" rows="3" />
      </NFormItem>
      <NFormItem label="状态">
        <NSwitch v-model:value="formData.status" :checked-value="1" :unchecked-value="0" />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="visible = false">取消</NButton>
        <NButton type="primary" :loading="saving" @click="handleSubmit">保存</NButton>
      </NSpace>
    </template>
  </NModal>
</template>

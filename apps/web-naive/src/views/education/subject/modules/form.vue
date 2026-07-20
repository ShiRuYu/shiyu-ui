<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSwitch, NButton, NSpace } from 'naive-ui';
import { createSubjectApi, updateSubjectApi } from '#/api/education/subject';

const visible = ref(false);
const formData = ref<any>({
  code: '',
  name: '',
  gradeLevel: '',
  icon: '',
  sortOrder: 0,
  status: 1,
});
const isEdit = ref(false);
const saving = ref(false);
const emit = defineEmits(['success']);

const gradeLevelOptions = [
  { label: '小学', value: 'PRIMARY' },
  { label: '初中', value: 'JUNIOR' },
  { label: '高中', value: 'SENIOR' },
  { label: '大学', value: 'COLLEGE' },
];

function open(row?: any) {
  isEdit.value = !!row;
  if (row) {
    formData.value = { ...row };
  } else {
    formData.value = { code: '', name: '', gradeLevel: '', icon: '', sortOrder: 0, status: 1 };
  }
  visible.value = true;
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateSubjectApi(formData.value.id, formData.value);
    } else {
      await createSubjectApi(formData.value);
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
  <NModal v-model:show="visible" title="学科" :mask-closable="false" preset="card" style="width:600px">
    <NForm :model="formData" label-placement="left" label-width="80">
      <NFormItem label="编码" path="code" :rule="{ required: true, message: '请输入编码' }">
        <NInput v-model:value="formData.code" placeholder="如 math" :disabled="isEdit" />
      </NFormItem>
      <NFormItem label="名称" path="name" :rule="{ required: true, message: '请输入名称' }">
        <NInput v-model:value="formData.name" placeholder="学科名称" />
      </NFormItem>
      <NFormItem label="学段">
        <NSelect v-model:value="formData.gradeLevel" :options="gradeLevelOptions" placeholder="请选择学段" />
      </NFormItem>
      <NFormItem label="图标">
        <NInput v-model:value="formData.icon" placeholder='图标名称，如 carbon:math-curve' />
      </NFormItem>
      <NFormItem label="排序">
        <NInputNumber v-model:value="formData.sortOrder" :min="0" style="width:100%" />
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

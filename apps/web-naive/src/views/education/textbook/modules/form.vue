<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NButton, NSpace } from 'naive-ui';
import { createTextbookApi, updateTextbookApi } from '#/api/education/textbook';
import { getSubjectListApi } from '#/api/education/subject';

const visible = ref(false);
const formData = ref<any>({
  name: '',
  subjectCode: '',
  grade: null as number | null,
  publisher: '',
  isbn: '',
});
const isEdit = ref(false);
const saving = ref(false);
const emit = defineEmits(['success']);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const gradeOptions = Array.from({ length: 12 }, (_, i) => {
  const map: Record<number, string> = {
    1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
    7: '七年级', 8: '八年级', 9: '九年级', 10: '高一', 11: '高二', 12: '高三',
  };
  return { label: map[i + 1], value: i + 1 };
});

async function loadSubjectOptions() {
  try {
    const res = await getSubjectListApi();
    subjectOptions.value = (res || []).map((s: any) => ({ label: s.name, value: s.code }));
  } catch { /* ignore */ }
}

function open(row?: any) {
  isEdit.value = !!row;
  if (row) {
    formData.value = { ...row };
  } else {
    formData.value = { name: '', subjectCode: '', grade: null, publisher: '', isbn: '' };
  }
  visible.value = true;
  loadSubjectOptions();
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateTextbookApi(formData.value.id, formData.value);
    } else {
      await createTextbookApi(formData.value);
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
  <NModal v-model:show="visible" title="教材" :mask-closable="false" preset="card" style="width:600px">
    <NForm :model="formData" label-placement="left" label-width="80">
      <NFormItem label="名称" path="name" :rule="{ required: true, message: '请输入名称' }">
        <NInput v-model:value="formData.name" placeholder="教材名称" />
      </NFormItem>
      <NFormItem label="学科" path="subjectCode" :rule="{ required: true, message: '请选择学科' }">
        <NSelect v-model:value="formData.subjectCode" :options="subjectOptions" placeholder="请选择学科" />
      </NFormItem>
      <NFormItem label="年级">
        <NSelect v-model:value="formData.grade" :options="gradeOptions" placeholder="请选择年级" />
      </NFormItem>
      <NFormItem label="出版社">
        <NInput v-model:value="formData.publisher" placeholder="出版社名称" />
      </NFormItem>
      <NFormItem label="ISBN">
        <NInput v-model:value="formData.isbn" placeholder="ISBN 编号" />
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

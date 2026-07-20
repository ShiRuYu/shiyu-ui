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
  NSwitch,
} from 'naive-ui';

import { createCourseApi, updateCourseApi } from '#/api/education/course';
import { getSubjectListApi } from '#/api/education/subject';

const emit = defineEmits(['success']);
const visible = ref(false);
const formData = ref<any>({
  name: '',
  description: '',
  subjectCode: '',
  grade: null as null | number,
  textbookId: null as null | number,
  teacherId: null as null | number,
  coverUrl: '',
  totalHours: 0,
  status: 1,
});
const isEdit = ref(false);
const saving = ref(false);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const gradeOptions = Array.from({ length: 12 }, (_, i) => {
  const map: Record<number, string> = {
    1: '一年级',
    2: '二年级',
    3: '三年级',
    4: '四年级',
    5: '五年级',
    6: '六年级',
    7: '七年级',
    8: '八年级',
    9: '九年级',
    10: '高一',
    11: '高二',
    12: '高三',
  };
  return { label: map[i + 1], value: i + 1 };
});

async function loadSubjectOptions() {
  try {
    const res = await getSubjectListApi();
    subjectOptions.value = (res || []).map((s: any) => ({
      label: s.name,
      value: s.code,
    }));
  } catch {
    /* ignore */
  }
}

function open(row?: any) {
  isEdit.value = !!row;
  if (row) {
    formData.value = { ...row };
  } else {
    formData.value = {
      name: '',
      description: '',
      subjectCode: '',
      grade: null,
      textbookId: null,
      teacherId: null,
      coverUrl: '',
      totalHours: 0,
      status: 1,
    };
  }
  visible.value = true;
  loadSubjectOptions();
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateCourseApi(formData.value.id, formData.value);
    } else {
      await createCourseApi(formData.value);
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
    title="课程"
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
        <NInput v-model:value="formData.name" placeholder="课程名称" />
      </NFormItem>
      <NFormItem label="描述">
        <NInput
          v-model:value="formData.description"
          type="textarea"
          rows="3"
          placeholder="课程描述"
        />
      </NFormItem>
      <NFormItem label="学科">
        <NSelect
          v-model:value="formData.subjectCode"
          :options="subjectOptions"
          placeholder="请选择学科"
        />
      </NFormItem>
      <NFormItem label="年级">
        <NSelect
          v-model:value="formData.grade"
          :options="gradeOptions"
          placeholder="请选择年级"
        />
      </NFormItem>
      <NFormItem label="教材ID">
        <NInputNumber
          v-model:value="formData.textbookId"
          :min="0"
          placeholder="关联教材ID"
          style="width: 100%"
        />
      </NFormItem>
      <NFormItem label="教师ID">
        <NInputNumber
          v-model:value="formData.teacherId"
          :min="0"
          placeholder="教师ID"
          style="width: 100%"
        />
      </NFormItem>
      <NFormItem label="封面URL">
        <NInput v-model:value="formData.coverUrl" placeholder="封面图片链接" />
      </NFormItem>
      <NFormItem label="总课时">
        <NInputNumber
          v-model:value="formData.totalHours"
          :min="0"
          style="width: 100%"
        />
      </NFormItem>
      <NFormItem label="状态">
        <NSwitch
          v-model:value="formData.status"
          :checked-value="1"
          :unchecked-value="0"
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

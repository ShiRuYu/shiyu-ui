<script setup lang="ts">
import { ref } from 'vue';
import { NModal, NForm, NFormItem, NInput, NInputNumber, NSelect, NSwitch, NButton, NSpace, NDatePicker } from 'naive-ui';
import { createExamApi, updateExamApi } from '#/api/education/exam';
import { getSubjectListApi } from '#/api/education/subject';

const visible = ref(false);
const formData = ref<any>({
  name: '',
  type: '',
  subjectCode: '',
  grade: null as number | null,
  durationMin: 60,
  totalScore: 100,
  status: 1,
  teacherId: null as number | null,
  startTime: null as number | null,
  endTime: null as number | null,
});
const isEdit = ref(false);
const saving = ref(false);
const emit = defineEmits(['success']);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const typeOptions = [
  { label: '单元测试', value: 'UNIT_TEST' },
  { label: '期中考试', value: 'MIDTERM' },
  { label: '期末考试', value: 'FINAL' },
  { label: '模拟考试', value: 'MOCK' },
  { label: '随堂测验', value: 'QUIZ' },
];

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
    formData.value = { name: '', type: '', subjectCode: '', grade: null, durationMin: 60, totalScore: 100, status: 1, teacherId: null, startTime: null, endTime: null };
  }
  visible.value = true;
  loadSubjectOptions();
}

async function handleSubmit() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateExamApi(formData.value.id, formData.value);
    } else {
      await createExamApi(formData.value);
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
  <NModal v-model:show="visible" title="试卷" :mask-closable="false" preset="card" style="width:650px">
    <NForm :model="formData" label-placement="left" label-width="100">
      <NFormItem label="名称" path="name" :rule="{ required: true, message: '请输入名称' }">
        <NInput v-model:value="formData.name" placeholder="试卷名称" />
      </NFormItem>
      <NFormItem label="类型">
        <NSelect v-model:value="formData.type" :options="typeOptions" placeholder="请选择类型" />
      </NFormItem>
      <NFormItem label="学科">
        <NSelect v-model:value="formData.subjectCode" :options="subjectOptions" placeholder="请选择学科" />
      </NFormItem>
      <NFormItem label="年级">
        <NSelect v-model:value="formData.grade" :options="gradeOptions" placeholder="请选择年级" />
      </NFormItem>
      <NFormItem label="时长(分钟)">
        <NInputNumber v-model:value="formData.durationMin" :min="1" :max="300" style="width:100%" />
      </NFormItem>
      <NFormItem label="总分">
        <NInputNumber v-model:value="formData.totalScore" :min="1" :max="1000" style="width:100%" />
      </NFormItem>
      <NFormItem label="教师ID">
        <NInputNumber v-model:value="formData.teacherId" :min="0" placeholder="教师ID" style="width:100%" />
      </NFormItem>
      <NFormItem label="开始时间">
        <NDatePicker v-model:value="formData.startTime" type="datetime" style="width:100%" />
      </NFormItem>
      <NFormItem label="结束时间">
        <NDatePicker v-model:value="formData.endTime" type="datetime" style="width:100%" />
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

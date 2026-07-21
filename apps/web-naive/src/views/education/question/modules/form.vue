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
  NSwitch,
} from 'naive-ui';

import { createQuestionApi, updateQuestionApi } from '#/api/education/question';
import { getSubjectListApi } from '#/api/education/subject';

const emit = defineEmits(['success']);
const visible = ref(false);
const formData = ref<any>({
  code: '',
  type: '',
  subjectCode: '',
  grade: null as null | number,
  difficulty: 2,
  abilityDimension: '',
  title: '',
  options: '',
  answer: '',
  analysis: '',
  source: '',
  tags: '',
  status: 1,
});
const isEdit = ref(false);
const saving = ref(false);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

const typeOptions = [
  { label: '选择题 (CHOICE)', value: 'CHOICE' },
  { label: '填空题 (FILL)', value: 'FILL' },
  { label: '判断题 (JUDGE)', value: 'JUDGE' },
  { label: '简答题 (SHORT)', value: 'SHORT' },
  { label: '计算题 (CALC)', value: 'CALC' },
];

const difficultyOptions = [
  { label: '简单', value: 1 },
  { label: '中等', value: 2 },
  { label: '较难', value: 3 },
  { label: '困难', value: 4 },
];

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
      code: '',
      type: '',
      subjectCode: '',
      grade: null,
      difficulty: 2,
      abilityDimension: '',
      title: '',
      options: '',
      answer: '',
      analysis: '',
      source: '',
      tags: '',
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
      await updateQuestionApi(formData.value.id, formData.value);
    } else {
      await createQuestionApi(formData.value);
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
    title="题目"
    :mask-closable="false"
    preset="card"
    style="width: 650px"
  >
    <NForm :model="formData" label-placement="left" label-width="100">
      <NFormItem label="编码" path="code">
        <NInput
          v-model:value="formData.code"
          placeholder="题目编码"
          :disabled="isEdit"
        />
      </NFormItem>
      <NFormItem label="类型" :rule="{ required: true, message: '请选择类型' }">
        <NSelect
          v-model:value="formData.type"
          :options="typeOptions"
          placeholder="请选择题型"
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
      <NFormItem label="难度">
        <NSelect
          v-model:value="formData.difficulty"
          :options="difficultyOptions"
          placeholder="请选择难度"
        />
      </NFormItem>
      <NFormItem label="能力维度">
        <NInput
          v-model:value="formData.abilityDimension"
          placeholder="如 remember/understand/apply"
        />
      </NFormItem>
      <NFormItem label="标题" :rule="{ required: true, message: '请输入标题' }">
        <NInput
          v-model:value="formData.title"
          type="textarea"
          rows="2"
          placeholder="题目内容"
        />
      </NFormItem>
      <NFormItem label="选项">
        <NInput
          v-model:value="formData.options"
          type="textarea"
          rows="3"
          placeholder="JSON数组，如 [&quot;A.选项1&quot;,&quot;B.选项2&quot;]"
        />
      </NFormItem>
      <NFormItem label="答案">
        <NInput v-model:value="formData.answer" placeholder="正确答案" />
      </NFormItem>
      <NFormItem label="解析">
        <NInput
          v-model:value="formData.analysis"
          type="textarea"
          rows="3"
          placeholder="答案解析"
        />
      </NFormItem>
      <NFormItem label="来源">
        <NInput v-model:value="formData.source" placeholder="题目来源" />
      </NFormItem>
      <NFormItem label="标签">
        <NInput v-model:value="formData.tags" placeholder="JSON数组标签" />
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

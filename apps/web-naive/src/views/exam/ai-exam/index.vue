<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NInputNumber, NSelect, NSpace, NSpin } from 'naive-ui';

import { generateExam } from '#/api/agent/education';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const subjectCode = ref('MATH');
const grade = ref(9);
const duration = ref(90);

const subjectOptions = [
  { label: '数学', value: 'MATH' },
  { label: '物理', value: 'PHYSICS' },
  { label: '英语', value: 'ENGLISH' },
  { label: '化学', value: 'CHEMISTRY' },
];

async function handleGenerate() {
  loading.value = true;
  try {
    const res = await generateExam({
      studentId: 1,
      knowledgeIds: [5, 6],
      duration: duration.value,
    });
    result.value = JSON.stringify(res, null, 2);
  } catch (error) {
    result.value = 'AI组卷接口调用失败（需后端Agent支持）';
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.exam.aiExam')">
    <NCard>
      <NSpace class="mb-4">
        <NSelect
          v-model:value="subjectCode"
          :options="subjectOptions"
          style="width: 120px"
        />
        <NInputNumber
          v-model:value="grade"
          :min="1"
          :max="12"
          style="width: 100px"
        />
        <NInputNumber
          v-model:value="duration"
          :min="30"
          :max="180"
          style="width: 120px"
        />
        <NButton type="primary" :loading="loading" @click="handleGenerate">
          AI组卷
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="rounded bg-gray-50 p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-gray-400">
          配置参数点击"AI组卷"
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

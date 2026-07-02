<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NInputNumber, NSelect, NSpace, NSpin } from 'naive-ui';

import { practice } from '#/api/agent/education';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const difficulty = ref(2);
const count = ref(3);

const knowledgeOptions = [
  { label: '绝对值 (知识点ID: 5)', value: 5 },
  { label: '相反数 (知识点ID: 4)', value: 4 },
  { label: '数轴 (知识点ID: 3)', value: 3 },
  { label: '有理数运算 (知识点ID: 6)', value: 6 },
];

const difficultyOptions = [
  { label: '基础 (1)', value: 1 },
  { label: '提升 (2)', value: 2 },
  { label: '拔高 (3)', value: 3 },
  { label: '竞赛 (4)', value: 4 },
];

async function handlePractice() {
  if (!knowledgeId.value) return;
  loading.value = true;
  try {
    const res = await practice({
      studentId: 1,
      knowledgeId: knowledgeId.value,
      difficulty: difficulty.value,
      count: count.value,
    });
    result.value = JSON.stringify(res, null, 2);
  } catch (error) {
    result.value = 'AI出题接口调用失败（需后端Agent支持）';
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.practice')">
    <NCard>
      <NSpace class="mb-4" vertical>
        <NSpace>
          <NSelect
            v-model:value="knowledgeId"
            :options="knowledgeOptions"
            placeholder="选择知识点"
            style="width: 250px"
          />
          <NSelect
            v-model:value="difficulty"
            :options="difficultyOptions"
            style="width: 120px"
          />
          <NInputNumber
            v-model:value="count"
            :min="1"
            :max="10"
            style="width: 80px"
          />
          <NButton
            type="primary"
            :loading="loading"
            :disabled="!knowledgeId"
            @click="handlePractice"
            >
AI出题
</NButton>
        </NSpace>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="rounded bg-gray-50 p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-gray-400">
          选择参数点击"AI出题"
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

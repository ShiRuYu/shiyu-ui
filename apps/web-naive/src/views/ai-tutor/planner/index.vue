<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NDatePicker, NSelect, NSpace, NSpin } from 'naive-ui';

import { generatePlan } from '#/api/agent/tutor-agent';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref<any>(null);
const knowledgeId = ref<null | number>(null);
const targetDate = ref<number>(Date.now() + 14 * 86400000);

const knowledgeOptions = [
  { label: '二次函数', value: 8 },
  { label: '导数入门', value: 10 },
];

async function handlePlan() {
  if (!knowledgeId.value) return;
  loading.value = true;
  try {
    const date = new Date(targetDate.value).toISOString().split('T')[0] || '';
    const res = await generatePlan({
      studentId: 1,
      knowledgeId: knowledgeId.value,
      targetDate: date,
    });
    result.value = res;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.planner')">
    <NCard>
      <NSpace class="mb-4">
        <NSelect
          v-model:value="knowledgeId"
          :options="knowledgeOptions"
          placeholder="选择目标知识点"
          style="width: 250px"
        />
        <NDatePicker
          v-model:value="targetDate"
          type="date"
          style="width: 150px"
        />
        <NButton
          type="primary"
          :loading="loading"
          :disabled="!knowledgeId"
          @click="handlePlan"
        >
          生成计划
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="rounded bg-gray-50 p-4">
          <pre class="whitespace-pre-wrap text-sm">{{
            JSON.stringify(result, null, 2)
          }}</pre>
        </div>
        <div v-else class="py-10 text-center text-gray-400">
          选择目标知识点和日期，生成学习计划
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

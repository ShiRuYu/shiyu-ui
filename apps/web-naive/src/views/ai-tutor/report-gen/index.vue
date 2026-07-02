<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';

import { generateReport } from '#/api/agent/education';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const period = ref('WEEKLY');

const periodOptions = [
  { label: '周报', value: 'WEEKLY' },
  { label: '月报', value: 'MONTHLY' },
];

async function handleReport() {
  loading.value = true;
  try {
    const res = await generateReport({ studentId: 1, period: period.value });
    result.value = JSON.stringify(res, null, 2);
  } catch (error) {
    result.value = 'AI报告接口调用失败（需后端Agent支持）';
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.report')">
    <NCard>
      <NSpace class="mb-4">
        <NSelect
          v-model:value="period"
          :options="periodOptions"
          style="width: 120px"
        />
        <NButton type="primary" :loading="loading" @click="handleReport">
          生成报告
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="rounded bg-gray-50 p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-gray-400">
          点击"生成报告"生成学习报告
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

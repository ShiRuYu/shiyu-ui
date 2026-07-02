<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace } from 'naive-ui';

import { $t } from '#/locales';

const period = ref('WEEKLY');
const reportContent = ref('');
const loading = ref(false);

const periodOptions = [
  { label: $t('analytics.periodWeekly'), value: 'WEEKLY' },
  { label: $t('analytics.periodMonthly'), value: 'MONTHLY' },
];

async function generateReport() {
  loading.value = true;
  try {
    // TODO: Call ReportAgent API
    reportContent.value = '# 学习报告\n\n报告内容占位...';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('analytics.report')">
    <NCard>
      <NSpace class="mb-4">
        <NSelect
          v-model:value="period"
          :options="periodOptions"
          style="width: 150px"
        />
        <NButton type="primary" :loading="loading" @click="generateReport">
          {{ $t('analytics.generateReport') }}
        </NButton>
      </NSpace>

      <div v-if="reportContent" class="prose max-w-none p-4">
        <pre class="whitespace-pre-wrap">{{ reportContent }}</pre>
      </div>
      <div v-else class="py-20 text-center text-gray-400">
        点击"生成报告"按钮生成学习报告
      </div>
    </NCard>
  </Page>
</template>

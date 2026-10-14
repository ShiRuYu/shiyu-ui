<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace } from 'naive-ui';

import { generateReport } from '#/features/education';
import { $t } from '#/locales';

const period = ref('7d');
const reportContent = ref('');
const loading = ref(false);

const periodOptions = [
  { label: $t('analytics.periodWeekly'), value: '7d' },
  { label: $t('analytics.periodMonthly'), value: '30d' },
];

async function handleGenerate() {
  loading.value = true;
  try {
    const res = await generateReport({
      period: period.value,
    });
    reportContent.value = res.content;
  } catch (error) {
    console.error('Failed to generate report:', error);
    reportContent.value = $t('analytics.reportError');
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
        <NButton type="primary" :loading="loading" @click="handleGenerate">
          {{ $t('analytics.generateReport') }}
        </NButton>
      </NSpace>

      <div v-if="reportContent" class="prose max-w-none p-4">
        <pre class="whitespace-pre-wrap">{{ reportContent }}</pre>
      </div>
      <div v-else class="py-20 text-center text-gray-400">
        {{ $t('analytics.clickToGenerate') }}
      </div>
    </NCard>
  </Page>
</template>

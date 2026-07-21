<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace } from 'naive-ui';

import { generateReport } from '#/api/agent/tutor-agent';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const period = ref('WEEKLY');
const reportContent = ref('');
const loading = ref(false);
const { getCurrentStudentId } = useCurrentStudentId();

const periodOptions = [
  { label: $t('analytics.periodWeekly'), value: 'WEEKLY' },
  { label: $t('analytics.periodMonthly'), value: 'MONTHLY' },
];

async function handleGenerate() {
  loading.value = true;
  try {
    const res: any = await generateReport({
      studentId: getCurrentStudentId(),
      period: period.value,
    });
    reportContent.value =
      typeof res === 'string' ? res : JSON.stringify(res, null, 2);
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

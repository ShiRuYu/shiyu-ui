<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';

import { generateReport } from '#/api/agent/tutor-agent';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const period = ref('WEEKLY');

const periodOptions = [
  { label: $t('ai-tutor.weeklyReport'), value: 'WEEKLY' },
  { label: $t('ai-tutor.monthlyReport'), value: 'MONTHLY' },
];

async function handleReport() {
  loading.value = true;
  try {
    const res = await generateReport({ studentId: 1, period: period.value });
    result.value = JSON.stringify(res, null, 2);
  } catch (error) {
    result.value = $t('ai-tutor.featureRequestFailed');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.report')">
    <NCard>
      <NSpace class="mb-4" wrap>
        <NSelect
          v-model:value="period"
          :options="periodOptions"
          class="w-full sm:w-[140px]"
        />
        <NButton type="primary" :loading="loading" @click="handleReport">
          {{ $t('ai-tutor.generateReport') }}
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="bg-muted rounded p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-muted-foreground">
          {{ $t('ai-tutor.reportEmptyHint') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

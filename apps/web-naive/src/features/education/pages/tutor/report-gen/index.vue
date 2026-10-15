<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';

import { type EducationAgentApi, generateReport } from '#/features/education';
import { $t } from '#/locales';
import { accessibleCombobox as vAccessibleCombobox } from '#/shared/directives/accessible-combobox';

import TutorNavigation from '../TutorNavigation.vue';

const loading = ref(false);
const result = ref('');
const period = ref('7d');
const periodSelectOpen = ref(false);
const recordCount = ref<null | number>(null);
const averageScore = ref<null | number>(null);
const sources = ref<EducationAgentApi.TutorResponse['sources']>([]);

const periodOptions = [
  { label: $t('ai-tutor.weeklyReport'), value: '7d' },
  { label: $t('ai-tutor.monthlyReport'), value: '30d' },
];

async function handleReport() {
  loading.value = true;
  try {
    const res = await generateReport({
      period: period.value,
    });
    result.value = res.content;
    recordCount.value = res.recordCount;
    averageScore.value = res.averageScore;
    sources.value = res.sources;
  } catch (error) {
    result.value =
      error instanceof Error
        ? error.message
        : $t('ai-tutor.featureRequestFailed');
    console.error(error);
    sources.value = [];
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.report')">
    <TutorNavigation />
    <NCard>
      <NSpace class="mb-4" wrap>
        <NSelect
          v-accessible-combobox="{
            label: $t('ai-tutor.selectReportPeriod'),
            expanded: periodSelectOpen,
          }"
          v-model:value="period"
          v-model:show="periodSelectOpen"
          :options="periodOptions"
          class="w-full sm:w-[140px]"
        />
        <NButton type="primary" :loading="loading" @click="handleReport">
          {{ $t('ai-tutor.generateReport') }}
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="bg-muted rounded p-4">
          <div v-if="recordCount !== null" class="mb-2 text-sm">
            学习记录：{{ recordCount }}；平均分：{{ averageScore ?? '无数据' }}
          </div>
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
          <div v-if="sources.length" class="mt-4 text-sm">
            <strong>统计来源</strong>
            <ul class="mt-2 list-disc pl-5">
              <li v-for="source in sources" :key="source.recordId">
                记录 #{{ source.recordId }} · {{ source.recordType }}
                <span v-if="source.questionId">
                  · 题目 #{{ source.questionId }}</span
                >
                <span v-if="source.score !== null">
                  · {{ source.score }} 分</span
                >
                · {{ source.occurredAt.replace('T', ' ') }}
              </li>
            </ul>
          </div>
        </div>
        <div v-else class="py-10 text-center text-muted-foreground">
          {{ $t('ai-tutor.reportEmptyHint') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

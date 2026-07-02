<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { EducationAnalyticsApi } from '#/api/education/analytics';

import { onMounted, ref } from 'vue';
import { h } from 'vue';

import { Page } from '@vben/common-ui';

import { NDataTable, NProgress } from 'naive-ui';

import { getWeakPoints } from '#/api';
import { $t } from '#/locales';

const loading = ref(false);
const weakPoints = ref<EducationAnalyticsApi.WeakPointResponse[]>([]);

const columns: DataTableColumns<EducationAnalyticsApi.WeakPointResponse> = [
  { title: $t('knowledge.name'), key: 'knowledgeName' },
  { title: $t('education.course.subjectCode'), key: 'subjectCode', width: 100 },
  {
    title: $t('analytics.mastery'),
    key: 'mastery',
    width: 200,
    render(row) {
      const color =
        row.mastery < 30 ? '#e88080' : row.mastery < 60 ? '#f0a020' : '#63e2b7';
      return h(NProgress, {
        type: 'line',
        percentage: row.mastery,
        color,
      });
    },
  },
];

async function loadWeakPoints() {
  loading.value = true;
  try {
    weakPoints.value = await getWeakPoints(1);
  } catch (error) {
    console.error('Failed to load weak points:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadWeakPoints();
});
</script>

<template>
  <Page :title="$t('analytics.weak')">
    <NDataTable
      :columns="columns"
      :data="weakPoints"
      :loading="loading"
      striped
    />
  </Page>
</template>

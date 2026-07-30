<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import type { EducationAnalyticsApi } from '#/api/education/analytics';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NDataTable, NProgress } from 'naive-ui';

import { getWeakPoints } from '#/api';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const loading = ref(false);
const weakPoints = ref<EducationAnalyticsApi.WeakPointResponse[]>([]);
const { getCurrentStudentId } = useCurrentStudentId();

const columns: DataTableColumns<EducationAnalyticsApi.WeakPointResponse> = [
  { title: $t('knowledge.name'), key: 'knowledgeName' },
  { title: $t('education.course.subjectCode'), key: 'subjectCode', width: 100 },
  {
    title: $t('analytics.mastery'),
    key: 'mastery',
    width: 200,
    render(row) {
      const color =
        [
          { color: '#e88080', maximum: 30 },
          { color: '#f0a020', maximum: 60 },
        ].find((item) => row.mastery < item.maximum)?.color ?? '#63e2b7';
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
    weakPoints.value = await getWeakPoints(getCurrentStudentId());
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

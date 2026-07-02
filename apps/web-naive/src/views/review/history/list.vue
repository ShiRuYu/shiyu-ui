<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NDataTable, NTag, NProgress } from 'naive-ui';

import { getReviewsByStatus } from '#/api/education/review';
import { $t } from '#/locales';

import { h } from 'vue';

const loading = ref(false);
const history = ref<any[]>([]);

const columns: any[] = [
  { title: '知识点ID', key: 'knowledgeId', width: 100 },
  {
    title: $t('education.review.reviewRound'),
    key: 'reviewRound',
    width: 100,
    render(row: any) {
      return h(NTag, { type: 'warning', size: 'small' }, () => `第${row.reviewRound}轮`);
    },
  },
  { title: $t('education.review.reviewDate'), key: 'reviewDate', width: 120 },
  {
    title: $t('common.status'),
    key: 'status',
    width: 100,
    render(row: any) {
      const color: Record<string, string> = { PENDING: 'warning', COMPLETED: 'success', FAILED: 'error', OVERDUE: 'default' };
      return h(NTag, { type: (color[row.status] || 'default') as any, size: 'small' }, () => row.status);
    },
  },
  {
    title: $t('education.review.resultScore'),
    key: 'resultScore',
    width: 150,
    render(row: any) {
      if (!row.resultScore) return '-';
      return h(NProgress as any, { type: 'line', percentage: row.resultScore });
    },
  },
];

async function loadHistory() {
  loading.value = true;
  try {
    history.value = await getReviewsByStatus(1, 'COMPLETED');
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => loadHistory());
</script>

<template>
  <Page :title="$t('page.review.history')">
    <NDataTable :columns="columns" :data="history" :loading="loading" striped :row-key="(row: any) => row.id" />
  </Page>
</template>

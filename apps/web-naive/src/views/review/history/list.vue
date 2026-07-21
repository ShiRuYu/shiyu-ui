<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { h } from 'vue';

import { Page } from '@vben/common-ui';

import { NDataTable, NProgress, NTag } from 'naive-ui';

import { getReviewsByStatus } from '#/api/education-admin/review';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const loading = ref(false);
const history = ref<any[]>([]);
const { getCurrentStudentId } = useCurrentStudentId();

const columns: any[] = [
  { title: 'ID', key: 'id', width: 80 },
  {
    title: $t('education.review.knowledgeName'),
    key: 'knowledgeName',
    width: 150,
  },
  {
    title: $t('education.review.reviewRound'),
    key: 'reviewRound',
    width: 100,
    render(row: any) {
      return h(NTag, { type: 'warning', size: 'small' }, () =>
        $t('education.review.round', [row.reviewRound]),
      );
    },
  },
  { title: $t('education.review.reviewDate'), key: 'reviewDate', width: 120 },
  {
    title: $t('common.status'),
    key: 'status',
    width: 100,
    render(row: any) {
      const color: Record<string, string> = {
        PENDING: 'warning',
        COMPLETED: 'success',
        FAILED: 'error',
        OVERDUE: 'default',
      };
      return h(
        NTag,
        { type: (color[row.status] || 'default') as any, size: 'small' },
        () =>
          $t(
            `education.review.status${row.status === 2 /* COMPLETED */ ? 'Completed' : row.status === 0 /* PENDING */ ? 'Pending' : row.status}`,
          ),
      );
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
    history.value = await getReviewsByStatus(
      getCurrentStudentId(),
      2 /* COMPLETED */,
    );
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
    <NDataTable
      :columns="columns"
      :data="history"
      :loading="loading"
      striped
      :row-key="(row: any) => row.id"
    />
  </Page>
</template>

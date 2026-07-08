<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import { h, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NDataTable,
  NInputNumber,
  NSelect,
  NSpace,
  NTag,
} from 'naive-ui';

import { getQuestionBySubjectGrade } from '#/api';
import { getSubjectOptions } from '#/api/education/subject';
import { $t } from '#/locales';

const router = useRouter();
const loading = ref(false);
const questions = ref<any[]>([]);

const filterSubject = ref('MATH');
const filterGrade = ref(7);
const subjectOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadSubjectOptions() {
  try {
    const data = await getSubjectOptions();
    subjectOptions.value = data.map((s: any) => ({ label: s.name, value: s.code }));
  } catch (error) {
    console.error('Failed to load subject options:', error);
  }
}

const columns: DataTableColumns<any> = [
  { title: 'ID', key: 'id', width: 60 },
  {
    title: '题型',
    key: 'type',
    width: 80,
    render(row) {
      const typeMap: Record<string, string> = {
        CHOICE: '选择',
        FILL: '填空',
        SOLVE: '解答',
        JUDGE: '判断',
        ESSAY: '作文',
        EXPERIMENT: '实验',
      };
      return h(
        NTag,
        { type: 'info', size: 'small' },
        () => typeMap[row.type] || row.type,
      );
    },
  },
  {
    title: '难度',
    key: 'difficulty',
    width: 60,
    render(row) {
      const color =
        row.difficulty <= 1
          ? 'success'
          : row.difficulty <= 2
            ? 'warning'
            : 'error';
      return h(NTag, { type: color, size: 'small' }, () =>
        String(row.difficulty),
      );
    },
  },
  { title: '题目', key: 'title', minWidth: 300, ellipsis: { tooltip: true } },
  { title: '能力维度', key: 'abilityDimension', width: 100 },
  {
    title: '操作',
    key: 'action',
    width: 100,
    render(row) {
      return h(
        NButton,
        { size: 'small', type: 'primary', onClick: () => startPractice(row) },
        () => '开始练习',
      );
    },
  },
];

async function loadQuestions() {
  loading.value = true;
  try {
    questions.value = await getQuestionBySubjectGrade(
      filterSubject.value,
      filterGrade.value,
    );
  } catch (error) {
    console.error('Failed to load questions:', error);
  } finally {
    loading.value = false;
  }
}

function startPractice(row: any) {
  router.push({ path: `/practice/question/${row.id}` });
}

onMounted(() => {
  loadSubjectOptions();
  loadQuestions();
});
</script>

<template>
  <Page :title="$t('page.practice.question')">
    <template #extra>
      <NSpace>
        <NSelect
          v-model:value="filterSubject"
          :options="subjectOptions"
          style="width: 120px"
          @update:value="loadQuestions"
        />
        <NInputNumber
          v-model:value="filterGrade"
          :min="1"
          :max="12"
          style="width: 100px"
          @update:value="loadQuestions"
        />
      </NSpace>
    </template>

    <NDataTable
      :columns="columns"
      :data="questions"
      :loading="loading"
      striped
      :row-key="(row: any) => row.id"
    />
  </Page>
</template>

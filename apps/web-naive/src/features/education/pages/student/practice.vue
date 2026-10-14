<script lang="ts" setup>
import type { DataTableColumns } from 'naive-ui';

import { h, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NDataTable,
  NInput,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import {
  type EducationQuestionApi,
  getCurrentStudent,
  getPracticeQuestions,
  getWrongPracticeQuestions,
} from '#/features/education';
import { EducationAdminQuestionPage as AdminQuestionList } from '#/features/education';
import { $t } from '#/locales';

const accessStore = useAccessStore();
const router = useRouter();
const loading = ref(false);
const questions = ref<EducationQuestionApi.PracticeQuestion[]>([]);
const wrongQuestions = ref<EducationQuestionApi.WrongPracticeQuestion[]>([]);
const activeTab = ref('student');
const adminPermission = accessStore.accessCodes.includes('edu:question:list');

const filterSubject = ref('MATH');
const grade = ref<null | number>(null);

const columns: DataTableColumns<EducationQuestionApi.PracticeQuestion> = [
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
  { title: '题目', key: 'title', minWidth: 300, ellipsis: { tooltip: true } },
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

const wrongColumns: DataTableColumns<EducationQuestionApi.WrongPracticeQuestion> =
  [
    { title: '题目', key: 'title', minWidth: 260 },
    { title: '上次答案', key: 'lastAnswer', width: 100 },
    { title: '连续答对', key: 'correctTimes', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 110,
      render(row) {
        return h(
          NButton,
          {
            size: 'small',
            onClick: () =>
              router.push(
                `/education-center/practice/questions/${row.questionId}`,
              ),
          },
          () => '继续练习',
        );
      },
    },
  ];

async function loadQuestions() {
  loading.value = true;
  try {
    if (grade.value === null) {
      const student = await getCurrentStudent();
      grade.value = student?.grade ?? null;
    }
    if (grade.value === null) throw new Error('当前账号未关联学生档案');
    questions.value = await getPracticeQuestions(
      filterSubject.value,
      grade.value,
    );
  } catch (error) {
    console.error('Failed to load questions:', error);
  } finally {
    loading.value = false;
  }
}

function startPractice(row: EducationQuestionApi.PracticeQuestion) {
  router.push({
    path: `/education-center/practice/questions/${row.id}`,
  });
}

function questionRowKey(row: EducationQuestionApi.PracticeQuestion) {
  return row.id;
}

function wrongRowKey(row: EducationQuestionApi.WrongPracticeQuestion) {
  return row.id;
}

onMounted(() => {
  loadQuestions();
});

watch(activeTab, async (tab) => {
  if (tab === 'wrong') {
    try {
      wrongQuestions.value = await getWrongPracticeQuestions();
    } catch (error) {
      console.error('Failed to load wrong questions:', error);
    }
  }
});
</script>

<template>
  <Page>
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 学生端：题库练习 -->
      <NTabPane name="student" :tab="$t('page.practice.question')">
        <NSpace class="mb-4" justify="end">
          <NInput
            v-model:value="filterSubject"
            placeholder="学科编码，如 MATH"
            style="width: 180px"
            @keyup.enter="loadQuestions"
          />
          <NButton @click="loadQuestions">筛选</NButton>
        </NSpace>
        <NDataTable
          :columns="columns"
          :data="questions"
          :loading="loading"
          striped
          :row-key="questionRowKey"
        />
      </NTabPane>

      <NTabPane name="wrong" tab="我的错题">
        <NDataTable
          :columns="wrongColumns"
          :data="wrongQuestions"
          :row-key="wrongRowKey"
          striped
        />
      </NTabPane>

      <!-- 管理端：题库管理 -->
      <NTabPane
        v-if="adminPermission"
        name="admin"
        :tab="$t('page.eduAdmin.question')"
      >
        <AdminQuestionList />
      </NTabPane>
    </NTabs>
  </Page>
</template>

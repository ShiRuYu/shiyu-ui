<script lang="ts" setup>
import type { TagProps } from 'naive-ui';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  NButton,
  NCard,
  NEmpty,
  NGi,
  NGrid,
  NInput,
  NPagination,
  NSpace,
  NTabPane,
  NTabs,
  NTag,
} from 'naive-ui';

import {
  type EducationExamApi,
  getAvailableExamSummaries,
  getExamHistory,
} from '#/features/education';
import { EducationAdminExamPage as AdminExamList } from '#/features/education';
import { getDictByType } from '#/features/iam';
import { $t } from '#/locales';

const accessStore = useAccessStore();
const router = useRouter();
const exams = ref<EducationExamApi.Summary[]>([]);
const history = ref<EducationExamApi.Summary[]>([]);
const loading = ref(false);
const pageNum = ref(1);
const pageSize = 9;
const total = ref(0);
const historyTotal = ref(0);
const historyPage = ref(1);
const subjectCode = ref('');
const pageCount = computed(() =>
  Math.max(1, Math.ceil(total.value / pageSize)),
);
const activeTab = ref('student');
const adminPermission = accessStore.accessCodes.includes('edu:exam:list');

const typeMap = ref<Record<string, string>>({
  DAILY_QUIZ: '日常测验',
  UNIT_TEST: '单元测验',
  MIDTERM: '期中考试',
  FINAL: '期末考试',
  MOCK: '模拟考试',
  AI_GENERATED: '智能组卷',
});

const typeColor: Record<string, TagProps['type']> = {
  DAILY_QUIZ: 'info',
  UNIT_TEST: 'success',
  MIDTERM: 'warning',
  FINAL: 'error',
  MOCK: 'default',
  AI_GENERATED: 'primary',
};

async function loadTypeMap() {
  try {
    const data = await getDictByType('EXAM_TYPE');
    const labels: Record<string, string> = {};
    for (const item of data) {
      labels[item.dictValue] = item.dictLabel;
    }
    typeMap.value = { ...typeMap.value, ...labels };
  } catch (error) {
    console.error('Failed to load type map:', error);
  }
}

async function loadExams() {
  loading.value = true;
  try {
    const page = await getAvailableExamSummaries(
      pageNum.value,
      pageSize,
      subjectCode.value.trim(),
    );
    exams.value = page.items;
    total.value = page.total;
  } catch (error) {
    console.error('Failed to load exams:', error);
  } finally {
    loading.value = false;
  }
}

async function loadHistory() {
  const page = await getExamHistory(historyPage.value, pageSize);
  history.value = page.items;
  historyTotal.value = page.total;
}

function openExam(exam: EducationExamApi.Summary) {
  if (exam.attemptId && ['EXPIRED', 'SUBMITTED'].includes(exam.attemptStatus)) {
    router.push({
      path: `/education-center/practice/exams/result/${exam.attemptId}`,
    });
  } else {
    router.push({
      path: `/education-center/practice/exams/take/${exam.examId}`,
    });
  }
}

function filterExams() {
  pageNum.value = 1;
  loadExams();
  void loadHistory();
}

function changePage(page: number) {
  pageNum.value = page;
  loadExams();
}

onMounted(() => {
  if (accessStore.accessCodes.includes('system:dict:list')) loadTypeMap();
  loadExams();
});

watch(activeTab, (tab) => {
  if (tab === 'history') void loadHistory();
});
</script>

<template>
  <Page>
    <NTabs v-model:value="activeTab" type="line" animated>
      <!-- 学生端：在线考试 -->
      <NTabPane name="student" :tab="$t('page.exam.list')">
        <NSpace class="mb-4">
          <NInput
            v-model:value="subjectCode"
            placeholder="学科编码，如 MATH"
            clearable
            @keyup.enter="filterExams"
          />
          <NButton :loading="loading" @click="filterExams">筛选</NButton>
        </NSpace>
        <NGrid cols="1 s:2 l:3" responsive="screen" :x-gap="16" :y-gap="16">
          <NGi v-for="exam in exams" :key="exam.examId">
            <NCard hoverable>
              <template #header>
                <span class="text-base font-medium">{{ exam.name }}</span>
              </template>
              <template #header-extra>
                <NTag :type="typeColor[exam.type] || 'default'" size="small">
                  {{ typeMap[exam.type] || exam.type }}
                </NTag>
              </template>

              <NSpace vertical class="text-sm text-gray-500">
                <span
                  >{{ $t('education.course.subjectCode') }}:
                  {{ exam.subjectCode }}</span
                >
                <span
                  >{{ $t('education.course.grade') }}: {{ exam.grade }}</span
                >
                <span
                  >{{ $t('education.exam.durationMin') }}:
                  {{ exam.durationMin }}</span
                >
                <span
                  >{{ $t('education.exam.totalScore') }}:
                  {{ exam.totalScore }}</span
                >
                <NTag
                  :type="
                    exam.attemptStatus === 'SUBMITTED' ? 'success' : 'info'
                  "
                  size="small"
                >
                  {{
                    exam.attemptStatus === 'NOT_STARTED'
                      ? '未开始'
                      : exam.attemptStatus === 'IN_PROGRESS'
                        ? '作答中'
                        : exam.attemptStatus === 'EXPIRED'
                          ? '已到期'
                          : '已提交'
                  }}
                </NTag>
              </NSpace>

              <template #footer>
                <NButton type="primary" block @click="openExam(exam)">
                  {{
                    exam.attemptStatus === 'NOT_STARTED'
                      ? '开始考试'
                      : exam.attemptStatus === 'IN_PROGRESS'
                        ? '继续考试'
                        : '查看结果'
                  }}
                </NButton>
              </template>
            </NCard>
          </NGi>
        </NGrid>

        <div
          v-if="!loading && exams.length === 0"
          class="py-20 text-center text-gray-400"
        >
          当前没有可参加的考试
        </div>
        <NPagination
          v-if="total > pageSize"
          class="mt-4"
          :page="pageNum"
          :page-count="pageCount"
          @update:page="changePage"
        />
      </NTabPane>

      <NTabPane name="history" tab="考试记录">
        <NGrid cols="1 s:2 l:3" responsive="screen" :x-gap="16" :y-gap="16">
          <NGi v-for="exam in history" :key="exam.attemptId || exam.examId">
            <NCard :title="exam.name">
              <NSpace vertical>
                <span>{{ exam.subjectCode }} · {{ exam.totalScore }} 分</span>
                <NTag>
                  {{
                    exam.attemptStatus === 'IN_PROGRESS'
                      ? '作答中'
                      : exam.attemptStatus === 'EXPIRED'
                        ? '已到期'
                        : '已提交'
                  }}
                </NTag>
                <span v-if="exam.score !== null">得分：{{ exam.score }}</span>
              </NSpace>
              <template #footer>
                <NButton block @click="openExam(exam)">
                  {{
                    exam.attemptStatus === 'IN_PROGRESS'
                      ? '继续考试'
                      : '查看结果'
                  }}
                </NButton>
              </template>
            </NCard>
          </NGi>
        </NGrid>
        <NEmpty v-if="history.length === 0" description="暂无考试记录" />
        <NPagination
          v-if="historyTotal > pageSize"
          class="mt-4"
          :page="historyPage"
          :page-count="Math.ceil(historyTotal / pageSize)"
          @update:page="
            (page: number) => {
              historyPage = page;
              loadHistory();
            }
          "
        />
      </NTabPane>

      <!-- 管理端：考试管理 -->
      <NTabPane
        v-if="adminPermission"
        name="admin"
        :tab="$t('page.eduAdmin.exam')"
      >
        <AdminExamList />
      </NTabPane>
    </NTabs>
  </Page>
</template>

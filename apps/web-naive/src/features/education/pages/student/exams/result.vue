<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NResult, NSpin, NTag } from 'naive-ui';

import { message } from '#/adapter/naive';
import { type EducationExamApi, getExamResult } from '#/features/education';
import { $t } from '#/locales';

const router = useRouter();
const route = useRoute();
const result = ref<EducationExamApi.Result | null>(null);
const loading = ref(false);

onMounted(async () => {
  const attemptId = Number(route.params.id);
  if (!Number.isSafeInteger(attemptId) || attemptId <= 0) return;
  loading.value = true;
  try {
    result.value = await getExamResult(attemptId);
  } catch (error) {
    console.error('Failed to load exam result:', error);
    message.error('无法加载考试结果');
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Page :title="$t('page.exam.result')">
    <NSpin :show="loading">
      <NCard v-if="result">
        <NResult
          status="success"
          title="交卷成功"
          :description="`得分 ${result.score} / ${result.totalScore}`"
        >
          <template #footer>
            <NButton
              type="primary"
              @click="router.push('/education-center/practice/exams')"
            >
              返回考试列表
            </NButton>
          </template>
        </NResult>
        <NCard
          v-for="(question, index) in result.questions"
          :key="question.questionId"
          class="mt-4"
          :title="`${index + 1}. ${question.title}`"
        >
          <div>你的答案：{{ question.answer || '未作答' }}</div>
          <div>正确答案：{{ question.correctAnswer }}</div>
          <div v-if="question.analysis">解析：{{ question.analysis }}</div>
          <NTag class="mt-2">
            得分 {{ question.score }} / {{ question.maxScore }}
          </NTag>
        </NCard>
      </NCard>
      <NCard v-else-if="!loading">考试结果不可用</NCard>
    </NSpin>
  </Page>
</template>

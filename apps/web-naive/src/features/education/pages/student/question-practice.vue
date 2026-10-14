<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NRadio,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  type EducationQuestionApi,
  getPracticeQuestion,
  submitPracticeAnswer,
} from '#/features/education';

const route = useRoute();
const router = useRouter();
const question = ref<EducationQuestionApi.PracticeQuestion | null>(null);
const feedback = ref<EducationQuestionApi.PracticeSubmission | null>(null);
const answer = ref<null | string>(null);
const loading = ref(false);
const checking = ref(false);
const submissionKey = ref('');

onMounted(async () => {
  const id = Number(route.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return;
  const storageKey = `practice-submission:${id}`;
  submissionKey.value =
    sessionStorage.getItem(storageKey) ?? crypto.randomUUID();
  sessionStorage.setItem(storageKey, submissionKey.value);
  answer.value = sessionStorage.getItem(`${storageKey}:answer`);
  loading.value = true;
  try {
    question.value = await getPracticeQuestion(id);
  } catch (error) {
    console.error(error);
    message.error('练习题加载失败');
  } finally {
    loading.value = false;
  }
});

async function check() {
  if (!question.value || !answer.value || checking.value) return;
  checking.value = true;
  try {
    sessionStorage.setItem(
      `practice-submission:${question.value.id}:answer`,
      answer.value,
    );
    feedback.value = await submitPracticeAnswer(
      question.value.id,
      answer.value,
      submissionKey.value,
    );
    sessionStorage.removeItem(`practice-submission:${question.value.id}`);
    sessionStorage.removeItem(
      `practice-submission:${question.value.id}:answer`,
    );
  } catch (error) {
    console.error(error);
    message.error('判题失败，请重试');
  } finally {
    checking.value = false;
  }
}
</script>

<template>
  <Page title="题目练习">
    <template #extra>
      <NButton @click="router.back()">返回题库</NButton>
    </template>
    <NSpin :show="loading">
      <NCard v-if="question" :title="question.title">
        <NRadioGroup v-model:value="answer" :disabled="!!feedback">
          <NSpace vertical>
            <NRadio
              v-for="option in question.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
        <div class="mt-4">
          <NButton
            type="primary"
            :disabled="!answer || !!feedback"
            :loading="checking"
            @click="check"
          >
            提交答案
          </NButton>
        </div>
        <div v-if="feedback" class="mt-4">
          <NTag :type="feedback.correct ? 'success' : 'error'">
            {{ feedback.correct ? '回答正确' : '回答错误' }}
          </NTag>
          <p>正确答案：{{ feedback.correctAnswer }}</p>
          <p v-if="feedback.analysis">{{ feedback.analysis }}</p>
        </div>
      </NCard>
      <NCard v-else-if="!loading">练习题不可用</NCard>
    </NSpin>
  </Page>
</template>

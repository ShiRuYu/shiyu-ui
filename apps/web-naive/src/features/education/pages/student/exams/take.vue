<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NCountdown,
  NEmpty,
  NRadio,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  type EducationExamApi,
  getExamDraft,
  getExamResult,
  saveExamDraft,
  startExamAttempt,
  submitExamAttempt,
} from '#/features/education';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const exam = ref<EducationExamApi.Paper | null>(null);
const questions = computed(
  () => exam.value?.sections.flatMap((s) => s.questions) ?? [],
);
const answers = ref<Record<number, string>>({});
const loading = ref(false);
const submitting = ref(false);
const expired = ref(false);
const remainingMs = ref(0);
const saveState = ref<'error' | 'saved' | 'saving'>('saved');
const pending = new Map<number, string>();
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let flushing = false;

async function flushDrafts() {
  if (flushing || !exam.value?.attemptId || expired.value) return;
  flushing = true;
  try {
    while (pending.size > 0) {
      const [questionId, answer] = pending.entries().next().value!;
      saveState.value = 'saving';
      try {
        await saveExamDraft(exam.value.attemptId, questionId, answer);
        if (pending.get(questionId) === answer) pending.delete(questionId);
      } catch (error) {
        console.error('Failed to save exam draft:', error);
        saveState.value = 'error';
        return;
      }
    }
    saveState.value = 'saved';
  } finally {
    flushing = false;
  }
}

function queueDraft(questionId: number, answer: string) {
  pending.set(questionId, answer);
  saveState.value = 'saving';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => void flushDrafts(), 250);
}

async function loadExam() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    const data = await startExamAttempt(id);
    exam.value = data;
    remainingMs.value = Math.max(
      0,
      Date.parse(data.deadlineAt || '') - Date.now(),
    );
    expired.value = remainingMs.value === 0;
    if (expired.value) {
      await handleExpiry();
      return;
    }
    if (data.attemptId) {
      const saved = await getExamDraft(data.attemptId);
      answers.value = Object.fromEntries(
        Object.entries(saved).map(([key, value]) => [Number(key), value]),
      );
    }
  } catch (error) {
    console.error('Failed to load exam:', error);
    message.error('无法开始考试，请确认考试仍在开放时间内');
  } finally {
    loading.value = false;
  }
}

function setAnswer(questionId: number, answer: string) {
  answers.value[questionId] = answer;
  queueDraft(questionId, answer);
}

async function handleExpiry() {
  expired.value = true;
  if (!exam.value?.attemptId) return;
  try {
    const result = await getExamResult(exam.value.attemptId);
    await router.replace(
      `/education-center/practice/exams/result/${result.attemptId}`,
    );
  } catch (error) {
    console.error('Failed to finalize expired exam:', error);
    message.error('自动收卷暂未完成，请重试查看结果');
  }
}

async function handleSubmit() {
  if (!exam.value?.attemptId || submitting.value || expired.value) return;
  submitting.value = true;
  try {
    if (saveTimer) clearTimeout(saveTimer);
    await flushDrafts();
    const result = await submitExamAttempt(
      exam.value.attemptId,
      questions.value.map((question) => ({
        questionId: question.questionId,
        answer: answers.value[question.questionId] || '',
      })),
    );
    await router.replace(
      `/education-center/practice/exams/result/${result.attemptId}`,
    );
  } catch (error) {
    console.error('Failed to submit exam:', error);
    message.error('交卷失败，请检查考试期限后重试');
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  window.addEventListener('online', flushDrafts);
  void loadExam();
});
onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer);
  window.removeEventListener('online', flushDrafts);
});
</script>

<template>
  <Page :title="exam?.name || $t('page.exam.take')">
    <template #extra>
      <NSpace>
        <NCountdown
          v-if="exam?.deadlineAt && !expired"
          :duration="remainingMs"
          :active="!expired"
          @finish="handleExpiry"
        />
        <NTag
          v-if="exam?.attemptId"
          :type="saveState === 'error' ? 'error' : 'info'"
        >
          {{
            saveState === 'saved'
              ? '草稿已保存'
              : saveState === 'saving'
                ? '正在保存'
                : '保存失败'
          }}
        </NTag>
        <NButton v-if="saveState === 'error' && !expired" @click="flushDrafts">
          重试保存
        </NButton>
        <NButton v-if="expired" @click="handleExpiry">查看收卷结果</NButton>
        <NButton @click="router.back()">
          {{ $t('common.back') }}
        </NButton>
        <NButton
          type="primary"
          :loading="submitting"
          :disabled="!exam?.attemptId || expired || questions.length === 0"
          @click="handleSubmit"
        >
          {{ $t('education.exam.submit') }}
        </NButton>
      </NSpace>
    </template>

    <NSpin :show="loading">
      <div v-if="exam" class="space-y-4">
        <NCard>
          <NSpace>
            <NTag type="info">{{ exam.subjectCode }}</NTag>
            <NTag>
              {{ $t('education.exam.totalScore') }}: {{ exam.totalScore }}
            </NTag>
            <NTag>
              {{ $t('education.exam.durationMin') }}: {{ exam.durationMin
              }}{{ $t('common.minute') }}
            </NTag>
          </NSpace>
        </NCard>

        <div v-if="questions.length" class="space-y-4">
          <NCard
            v-for="(q, idx) in questions"
            :key="q.id"
            :title="`${idx + 1}. ${q.title}`"
          >
            <template #header-extra>
              <NTag size="small">
                {{
                  q.type === 'CHOICE'
                    ? $t('education.question.typeChoice')
                    : q.type === 'JUDGE'
                      ? $t('education.question.typeJudge')
                      : q.type === 'FILL'
                        ? $t('education.question.typeFill')
                        : $t('education.question.typeSolve')
                }}
              </NTag>
            </template>

            <NRadioGroup
              v-if="q.type === 'CHOICE'"
              :value="answers[q.questionId]"
              @update:value="(v: string) => setAnswer(q.questionId, v)"
            >
              <NSpace vertical>
                <NRadio
                  v-for="opt in q.options || []"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </NRadio>
              </NSpace>
            </NRadioGroup>
          </NCard>
        </div>

        <NEmpty v-else :description="$t('education.exam.noQuestions')" />
      </div>
    </NSpin>
  </Page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NCountdown,
  NInput,
  NRadio,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import { getExamById, submitExam } from '#/api/education/exam';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const exam = ref<any>(null);
const questions = ref<any[]>([]);
const answers = ref<Record<number, string>>({});
const loading = ref(false);
const submitting = ref(false);

async function loadExam() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    const data = await getExamById(id);
    exam.value = data;
    if (data?.questions?.length) {
      questions.value = data.questions;
    } else if (data?.sections?.length) {
      questions.value = data.sections.flatMap((s: any) => s.questions || []);
    }
  } catch (error) {
    console.error('Failed to load exam:', error);
  } finally {
    loading.value = false;
  }
}

function setAnswer(questionId: number, answer: string) {
  answers.value[questionId] = answer;
}

async function handleSubmit() {
  if (!exam.value) return;
  submitting.value = true;
  try {
    await submitExam(exam.value.id, { studentId: 1, answer: JSON.stringify(answers.value) });
    message.success($t('education.exam.submitSuccess'));
    router.push({ path: `/exam/result/${exam.value.id}` });
  } catch (error) {
    console.error('Failed to submit exam:', error);
    message.error($t('education.exam.submitFailed'));
  } finally {
    submitting.value = false;
  }
}

onMounted(() => loadExam());
</script>

<template>
  <Page :title="exam?.name || $t('page.exam.take')">
    <template #extra>
      <NSpace>
        <NCountdown
          v-if="exam?.durationMin"
          :duration="exam.durationMin * 60 * 1000"
          :active="true"
        />
        <NButton @click="router.back()">
          {{ $t('common.back') }}
        </NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
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
              {{ $t('education.exam.durationMin') }}: {{ exam.durationMin }}{{ $t('common.minute') }}
            </NTag>
          </NSpace>
        </NCard>

        <div v-if="questions.length" class="space-y-4">
          <NCard
            v-for="(q, idx) in questions"
            :key="q.id"
            :title="`${idx + 1}. ${q.title || q.name || ''}`"
          >
            <template #header-extra>
              <NTag size="small">
                {{ q.type === 'CHOICE' ? $t('education.question.typeChoice') : q.type === 'JUDGE' ? $t('education.question.typeJudge') : q.type === 'FILL' ? $t('education.question.typeFill') : $t('education.question.typeSolve') }}
              </NTag>
            </template>

            <NRadioGroup
              v-if="q.type === 'CHOICE' || q.type === 'JUDGE'"
              :value="answers[q.id]"
              @update:value="(v: string) => setAnswer(q.id, v)"
            >
              <NSpace vertical>
                <NRadio
                  v-for="opt in (q.options || [])"
                  :key="opt.value || opt"
                  :value="opt.value || opt"
                >
                  {{ opt.label || opt.value || opt }}
                </NRadio>
              </NSpace>
            </NRadioGroup>

            <NInput
              v-else
              :value="answers[q.id] || ''"
              :placeholder="$t('education.question.inputAnswer')"
              type="textarea"
              :rows="3"
              @update:value="(v: string) => setAnswer(q.id, v)"
            />
          </NCard>
        </div>

        <NEmpty v-else :description="$t('education.exam.noQuestions')" />
      </div>
    </NSpin>
  </Page>
</template>

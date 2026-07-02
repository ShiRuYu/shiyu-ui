<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NRadioGroup, NRadio, NSpace, NTag, NSpin, NCountdown } from 'naive-ui';

import { getExamById, submitExam } from '#/api';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const exam = ref<any>(null);
const answers = ref<Record<number, string>>({});
const loading = ref(false);

async function loadExam() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    exam.value = await getExamById(id);
  } catch (error) {
    console.error('Failed to load exam:', error);
  } finally {
    loading.value = false;
  }
}

function setAnswer(questionId: number, answer: string) {
  answers.value[questionId] = answer;
}

function handleSubmit() {
  if (!exam.value) return;
  const data = { studentId: 1, answer: JSON.stringify(answers.value) };
  submitExam(exam.value.id, data).then(() => {
    router.push({ path: `/exam/result/${exam.value.id}` });
  });
}

onMounted(() => loadExam());
</script>

<template>
  <Page :title="exam?.name || $t('page.exam.take')">
    <template #extra>
      <NSpace>
        <NCountdown v-if="exam?.durationMin" :duration="exam.durationMin * 60 * 1000" :active="true" />
        <NButton @click="router.back()">退出</NButton>
        <NButton type="primary" @click="handleSubmit">交卷</NButton>
      </NSpace>
    </template>

    <NSpin :show="loading">
      <div v-if="exam" class="space-y-4">
        <NCard>
          <NSpace>
            <NTag type="info">{{ exam.subjectCode }}</NTag>
            <NTag>{{ $t('education.exam.totalScore') }}: {{ exam.totalScore }}</NTag>
            <NTag>{{ $t('education.exam.durationMin') }}: {{ exam.durationMin }}分钟</NTag>
          </NSpace>
        </NCard>

        <!-- Question list - for demo purposes showing mock questions -->
        <NCard v-for="i in 5" :key="i" :title="`第 ${i} 题`">
          <p class="mb-4">题目占位内容</p>
          <NRadioGroup :value="answers[i]" @update:value="(v: string) => setAnswer(i, v)">
            <NSpace vertical>
              <NRadio v-for="opt in ['A', 'B', 'C', 'D']" :key="opt" :value="opt">
                {{ opt }}. 选项内容...
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </NCard>
      </div>
    </NSpin>
  </Page>
</template>

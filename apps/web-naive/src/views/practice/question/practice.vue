<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NInput,
  NRadio,
  NRadioGroup,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { getQuestionById } from '#/api';
import { $t } from '#/locales';

const route = useRoute();
const router = useRouter();
const question = ref<any>(null);
const userAnswer = ref('');
const submitted = ref(false);
const isCorrect = ref(false);
const loading = ref(false);

const typeMap: Record<string, string> = {
  CHOICE: '选择题',
  FILL: '填空题',
  SOLVE: '解答题',
  JUDGE: '判断题',
  ESSAY: '作文题',
  EXPERIMENT: '实验题',
};

async function loadQuestion() {
  const id = Number(route.params.id);
  if (!id) return;
  loading.value = true;
  try {
    question.value = await getQuestionById(id);
  } catch (error) {
    console.error('Failed to load question:', error);
  } finally {
    loading.value = false;
  }
}

function parseOptions(optionsStr: string): string[] {
  if (!optionsStr) return [];
  try {
    return JSON.parse(optionsStr);
  } catch {
    return [];
  }
}

function submitAnswer() {
  if (!question.value) return;
  const correct =
    String(userAnswer.value).trim().toUpperCase() ===
    String(question.value.answer).trim().toUpperCase();
  isCorrect.value = correct;
  submitted.value = true;
}

onMounted(() => {
  loadQuestion();
});
</script>

<template>
  <Page :title="$t('page.practice.doing')">
    <template #extra>
      <NButton @click="router.back()">返回</NButton>
    </template>

    <NSpin :show="loading">
      <NCard v-if="question">
        <template #header>
          <NSpace>
            <NTag type="info">
              {{ typeMap[question.type] || question.type }}
            </NTag>
            <NTag
              :type="
                question.difficulty <= 1
                  ? 'success'
                  : question.difficulty <= 2
                    ? 'warning'
                    : 'error'
              "
            >
              难度 {{ question.difficulty }}
            </NTag>
            <NTag>{{ question.subjectCode }}</NTag>
          </NSpace>
        </template>

        <div class="mb-6 text-lg">{{ question.title }}</div>

        <div v-if="['CHOICE'].includes(question.type)" class="mb-4">
          <NRadioGroup v-model:value="userAnswer" :disabled="submitted">
            <NSpace vertical>
              <NRadio
                v-for="opt in parseOptions(question.options)"
                :key="opt"
                :value="opt.charAt(0)"
              >
                {{ opt }}
              </NRadio>
            </NSpace>
          </NRadioGroup>
        </div>

        <div v-else-if="['FILL'].includes(question.type)" class="mb-4">
          <NInput
            v-model:value="userAnswer"
            :disabled="submitted"
            placeholder="输入答案..."
          />
        </div>

        <div v-else-if="['JUDGE'].includes(question.type)" class="mb-4">
          <NRadioGroup v-model:value="userAnswer" :disabled="submitted">
            <NSpace>
              <NRadio value="TRUE">对</NRadio>
              <NRadio value="FALSE">错</NRadio>
            </NSpace>
          </NRadioGroup>
        </div>

        <div v-else class="mb-4">
          <NInput
            v-model:value="userAnswer"
            :disabled="submitted"
            type="textarea"
            rows="6"
            placeholder="输入解答过程..."
          />
        </div>

        <NSpace>
          <NButton
            v-if="!submitted"
            type="primary"
            :disabled="userAnswer === ''"
            @click="submitAnswer"
          >
            提交答案
          </NButton>
        </NSpace>

        <NCard
          v-if="submitted"
          class="mt-4"
          :title="isCorrect ? '✅ 回答正确' : '❌ 回答错误'"
          :segmented="true"
        >
          <p class="mb-2"><strong>正确答案：</strong>{{ question.answer }}</p>
          <p><strong>解析：</strong>{{ question.analysis }}</p>
        </NCard>
      </NCard>
    </NSpin>
  </Page>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NInputNumber, NSelect, NSpace, NSpin } from 'naive-ui';

import { practice } from '#/api/agent/tutor-agent';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const difficulty = ref(2);
const count = ref(3);

const knowledgeOptions = [
  { label: $t('ai-tutor.knowledgeAbsoluteValue'), value: 5 },
  { label: $t('ai-tutor.knowledgeOppositeNumber'), value: 4 },
  { label: $t('ai-tutor.knowledgeNumberLine'), value: 3 },
  { label: $t('ai-tutor.knowledgeRationalOperations'), value: 6 },
];

const difficultyOptions = [
  { label: $t('education.question.difficultyBasic'), value: 1 },
  { label: $t('education.question.difficultyMedium'), value: 2 },
  { label: $t('education.question.difficultyHard'), value: 3 },
  { label: $t('education.question.difficultyCompetition'), value: 4 },
];

async function handlePractice() {
  if (!knowledgeId.value) return;
  loading.value = true;
  try {
    const res = await practice({
      studentId: 1,
      knowledgeId: knowledgeId.value,
      difficulty: difficulty.value,
      count: count.value,
    });
    result.value = JSON.stringify(res, null, 2);
  } catch (error) {
    result.value = $t('ai-tutor.featureRequestFailed');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.practice')">
    <NCard>
      <NSpace class="mb-4" vertical>
        <NSpace wrap>
          <NSelect
            v-model:value="knowledgeId"
            :options="knowledgeOptions"
            class="w-full sm:w-[250px]"
            :placeholder="$t('ai-tutor.selectKnowledge')"
          />
          <NSelect
            v-model:value="difficulty"
            :options="difficultyOptions"
            class="w-full sm:w-[140px]"
          />
          <NInputNumber
            v-model:value="count"
            :min="1"
            :max="10"
            class="w-full sm:w-[100px]"
          />
          <NButton
            type="primary"
            :loading="loading"
            :disabled="!knowledgeId"
            @click="handlePractice"
          >
            {{ $t('ai-tutor.generateQuestions') }}
          </NButton>
        </NSpace>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="bg-muted rounded p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-muted-foreground">
          {{ $t('ai-tutor.practiceEmptyHint') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

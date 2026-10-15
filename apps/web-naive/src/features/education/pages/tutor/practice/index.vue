<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NInputNumber, NSelect, NSpace, NSpin } from 'naive-ui';

import { listTutorKnowledge, practice } from '#/features/education';
import { $t } from '#/locales';
import { accessibleCombobox as vAccessibleCombobox } from '#/shared/directives/accessible-combobox';

import TutorNavigation from '../TutorNavigation.vue';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const knowledgeSelectOpen = ref(false);
const difficulty = ref(2);
const difficultySelectOpen = ref(false);
const count = ref(3);
const knowledgeOptions = ref<Array<{ label: string; value: number }>>([]);
onMounted(async () => {
  try {
    knowledgeOptions.value = (await listTutorKnowledge()).map((point) => ({
      label: point.name,
      value: point.id,
    }));
  } catch (error) {
    result.value =
      error instanceof Error
        ? error.message
        : $t('ai-tutor.featureRequestFailed');
  }
});

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
      knowledgeId: knowledgeId.value,
      difficulty: difficulty.value,
      count: count.value,
    });
    result.value = res.content;
  } catch (error) {
    result.value =
      error instanceof Error
        ? error.message
        : $t('ai-tutor.featureRequestFailed');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.practice')">
    <TutorNavigation />
    <NCard>
      <NSpace class="mb-4" vertical>
        <NSpace wrap>
          <NSelect
            v-accessible-combobox="{
              label: $t('ai-tutor.selectKnowledge'),
              expanded: knowledgeSelectOpen,
            }"
            v-model:value="knowledgeId"
            v-model:show="knowledgeSelectOpen"
            :options="knowledgeOptions"
            class="w-full sm:w-[250px]"
            :placeholder="$t('ai-tutor.selectKnowledge')"
            style="width: 250px; max-width: 100%"
          />
          <NSelect
            v-accessible-combobox="{
              label: $t('ai-tutor.selectDifficulty'),
              expanded: difficultySelectOpen,
            }"
            v-model:value="difficulty"
            v-model:show="difficultySelectOpen"
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

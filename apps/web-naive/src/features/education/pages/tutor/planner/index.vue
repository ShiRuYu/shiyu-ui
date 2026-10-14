<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NDatePicker, NSelect, NSpace, NSpin } from 'naive-ui';

import { generatePlan, listTutorKnowledge } from '#/features/education';
import { $t } from '#/locales';

import TutorNavigation from '../TutorNavigation.vue';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const targetDate = ref<number>(Date.now() + 14 * 86_400_000);
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

async function handlePlan() {
  if (!knowledgeId.value) return;
  loading.value = true;
  try {
    const date = new Date(targetDate.value).toISOString().split('T')[0] || '';
    const res = await generatePlan({
      knowledgeId: knowledgeId.value,
      targetDate: date,
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
  <Page :title="$t('page.aiTutor.planner')">
    <TutorNavigation />
    <NCard>
      <NSpace class="mb-4" wrap>
        <NSelect
          v-model:value="knowledgeId"
          :options="knowledgeOptions"
          class="w-full sm:w-[250px]"
          :placeholder="$t('ai-tutor.selectTargetKnowledge')"
        />
        <NDatePicker
          v-model:value="targetDate"
          type="date"
          class="w-full sm:w-[160px]"
        />
        <NButton
          type="primary"
          :loading="loading"
          :disabled="!knowledgeId"
          @click="handlePlan"
        >
          {{ $t('ai-tutor.generatePlan') }}
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="bg-muted rounded p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-muted-foreground">
          {{ $t('ai-tutor.plannerEmptyHint') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

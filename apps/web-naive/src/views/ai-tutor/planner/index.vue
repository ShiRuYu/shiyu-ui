<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NDatePicker, NSelect, NSpace, NSpin } from 'naive-ui';

import { generatePlan } from '#/api/agent/tutor-agent';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref<any>(null);
const knowledgeId = ref<null | number>(null);
const targetDate = ref<number>(Date.now() + 14 * 86_400_000);

const knowledgeOptions = [
  { label: $t('ai-tutor.knowledgeQuadraticFunction'), value: 8 },
  { label: $t('ai-tutor.knowledgeCalculusIntroduction'), value: 10 },
];

async function handlePlan() {
  if (!knowledgeId.value) return;
  loading.value = true;
  try {
    const date = new Date(targetDate.value).toISOString().split('T')[0] || '';
    const res = await generatePlan({
      studentId: 1,
      knowledgeId: knowledgeId.value,
      targetDate: date,
    });
    result.value = res;
  } catch (error) {
    result.value = $t('ai-tutor.featureRequestFailed');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.planner')">
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
          <pre class="whitespace-pre-wrap text-sm">{{
            JSON.stringify(result, null, 2)
          }}</pre>
        </div>
        <div v-else class="py-10 text-center text-muted-foreground">
          {{ $t('ai-tutor.plannerEmptyHint') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

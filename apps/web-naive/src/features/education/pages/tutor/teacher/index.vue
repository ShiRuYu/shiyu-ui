<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';

import { teach } from '#/features/agent';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const style = ref('textual');

const knowledgeOptions = [
  { label: $t('ai-tutor.knowledgeAbsoluteValue'), value: 5 },
  { label: $t('ai-tutor.knowledgeOppositeNumber'), value: 4 },
  { label: $t('ai-tutor.knowledgeNumberLine'), value: 3 },
  { label: $t('ai-tutor.knowledgeRationalOperations'), value: 6 },
];

const styleOptions = [
  { label: $t('ai-tutor.styleTextual'), value: 'textual' },
  { label: $t('ai-tutor.styleVisual'), value: 'visual' },
  { label: $t('ai-tutor.styleInteractive'), value: 'interactive' },
];

async function handleTeach() {
  if (!knowledgeId.value) return;
  loading.value = true;
  try {
    const res = await teach({
      studentId: 1,
      knowledgeId: knowledgeId.value,
      style: style.value,
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
  <Page :title="$t('page.aiTutor.teacher')">
    <NCard>
      <NSpace class="mb-4" wrap>
        <NSelect
          v-model:value="knowledgeId"
          :options="knowledgeOptions"
          class="w-full sm:w-[250px]"
          :placeholder="$t('ai-tutor.selectKnowledge')"
        />
        <NSelect
          v-model:value="style"
          :options="styleOptions"
          class="w-full sm:w-[150px]"
        />
        <NButton
          type="primary"
          :loading="loading"
          :disabled="!knowledgeId"
          @click="handleTeach"
        >
          {{ $t('ai-tutor.startTeach') }}
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="bg-muted rounded p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-muted-foreground">
          {{ $t('ai-tutor.teacherEmptyHint') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';

import { listTutorKnowledge, teach } from '#/features/education';
import { $t } from '#/locales';
import { accessibleCombobox as vAccessibleCombobox } from '#/shared/directives/accessible-combobox';

import TutorNavigation from '../TutorNavigation.vue';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const knowledgeSelectOpen = ref(false);
const style = ref('textual');
const styleSelectOpen = ref(false);
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
      knowledgeId: knowledgeId.value,
      style: style.value,
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
  <Page :title="$t('page.aiTutor.teacher')">
    <TutorNavigation />
    <NCard>
      <NSpace class="mb-4" wrap>
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
            label: $t('ai-tutor.selectStyle'),
            expanded: styleSelectOpen,
          }"
          v-model:value="style"
          v-model:show="styleSelectOpen"
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

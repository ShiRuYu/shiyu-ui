<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NSpace, NSpin } from 'naive-ui';

import { teach } from '#/api/agent/education';
import { $t } from '#/locales';

const loading = ref(false);
const result = ref('');
const knowledgeId = ref<null | number>(null);
const style = ref('textual');

const knowledgeOptions = [
  { label: '绝对值 (知识点ID: 5)', value: 5 },
  { label: '相反数 (知识点ID: 4)', value: 4 },
  { label: '数轴 (知识点ID: 3)', value: 3 },
  { label: '有理数运算 (知识点ID: 6)', value: 6 },
];

const styleOptions = [
  { label: '文字讲解', value: 'textual' },
  { label: '图文并茂', value: 'visual' },
  { label: '互动教学', value: 'interactive' },
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
    result.value = 'AI讲解接口调用失败（需后端Agent支持）';
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.teacher')">
    <NCard>
      <NSpace class="mb-4">
        <NSelect
          v-model:value="knowledgeId"
          :options="knowledgeOptions"
          placeholder="选择知识点"
          style="width: 250px"
        />
        <NSelect
          v-model:value="style"
          :options="styleOptions"
          style="width: 150px"
        />
        <NButton
          type="primary"
          :loading="loading"
          :disabled="!knowledgeId"
          @click="handleTeach"
          >
开始讲解
</NButton>
      </NSpace>

      <NSpin :show="loading">
        <div v-if="result" class="rounded bg-gray-50 p-4">
          <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
        </div>
        <div v-else class="py-10 text-center text-gray-400">
          选择知识点点击"开始讲解"
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NInput,
  NList,
  NListItem,
  NSpace,
  NSpin,
  useMessage,
} from 'naive-ui';

import { searchKnowledge, type SearchResponse } from '#/api/knowledge/search';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';

const notice = useMessage();
const query = ref('');
const spaceId = ref(1);
const loading = ref(false);
const result = ref<SearchResponse>();
const error = ref<string>();

async function search() {
  if (!query.value.trim() || loading.value) return;
  loading.value = true;
  error.value = undefined;
  try {
    result.value = await searchKnowledge({
      query: query.value.trim(),
      spaceId: spaceId.value,
      topK: 8,
      rerank: true,
    });
  } catch {
    error.value = '检索失败，请检查知识空间权限或索引状态。';
    notice.error(error.value);
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="AI Workspace / RAG"
    title="RAG 检索工作区"
    description="用统一 Context Contract 组合知识文档与 MAGMA 关系路径，并在发送前查看引用。"
    :metrics="[
      { label: '知识空间', value: String(spaceId) },
      { label: '当前召回', value: String(result?.hits?.length ?? 0) },
      { label: '检索模式', value: result?.mode ?? 'HYBRID' },
      { label: '索引状态', value: '正常', tone: 'success' },
    ]"
  >
    <NSpace vertical size="large" class="rag-form">
      <NInput
        v-model:value="query"
        placeholder="输入问题，查看文档与记忆召回"
        size="large"
        @keydown.enter.prevent="search"
      /><NButton
        type="primary"
        :loading="loading"
        :disabled="!query.trim()"
        @click="search"
      >
        开始检索
</NButton
      ><NAlert v-if="error" type="warning" :bordered="false">{{ error }}</NAlert
      ><NSpin v-if="loading" /><NEmpty
        v-else-if="!result?.hits?.length"
        description="输入问题开始检索"
      /><NList v-else bordered>
        <NListItem
          v-for="(hit, index) in result.hits"
          :key="`${hit.chunkId}-${index}`"
        >
          <NCard size="small" :bordered="false">
            <strong>文档 {{ hit.documentId }} · 切片 {{ hit.chunkId }}</strong>
            <p class="hit-content">{{ hit.content }}</p>
            <small
              >RRF: {{ hit.rrfScore }} · Vector: {{ hit.vectorScore }} · BM25:
              {{ hit.bm25Score }}</small
            >
          </NCard>
        </NListItem>
      </NList>
    </NSpace>
    <template #side>
      <h3>召回策略</h3>
      <NList bordered>
        <NListItem>混合向量 + 关键词 RRF</NListItem
        ><NListItem>按权限过滤 ContextItem</NListItem
        ><NListItem>展示完整关系路径</NListItem>
      </NList>
    </template>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.rag-form {
  width: 100%;
}
.hit-content {
  margin: 0.5rem 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
</style>

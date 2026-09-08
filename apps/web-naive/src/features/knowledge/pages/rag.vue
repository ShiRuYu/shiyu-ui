<script setup lang="ts">
import type { SearchResponse } from '#/features/knowledge/api';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

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
import { storeToRefs } from 'pinia';

import { searchKnowledge } from '#/features/knowledge/api';
import KnowledgeSpaceHeader from '#/features/knowledge/ui/knowledge-space-header.vue';
import { PlatformWorkspaceShell } from '#/shared';
import { useKnowledgeStore } from '#/store';

const notice = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const query = ref('');
const loading = ref(false);
const result = ref<SearchResponse>();
const error = ref<string>();
const spaceId = computed(() => activeSpaceId.value);
let disposed = false;
let latestSearchRequest = 0;

async function search() {
  if (!query.value.trim() || loading.value) return;
  const currentSpaceId = activeSpaceId.value;
  if (!currentSpaceId) {
    notice.warning('请先选择知识空间');
    return;
  }
  const requestId = ++latestSearchRequest;
  loading.value = true;
  error.value = undefined;
  try {
    const response = await searchKnowledge({
      query: query.value.trim(),
      spaceId: currentSpaceId,
      topK: 8,
      rerank: true,
    });
    if (disposed || requestId !== latestSearchRequest) return;
    result.value = response;
  } catch {
    if (disposed || requestId !== latestSearchRequest) return;
    error.value = '检索失败，请检查知识空间权限或索引状态。';
    notice.error(error.value);
  } finally {
    if (!disposed && requestId === latestSearchRequest) loading.value = false;
  }
}

function resetResults() {
  latestSearchRequest += 1;
  loading.value = false;
  result.value = undefined;
  error.value = undefined;
}

watch(activeSpaceId, resetResults);

onMounted(() => {
  void store.loadSpaces().catch(() => {
    if (!disposed) notice.error('知识空间加载失败，请稍后重试');
  });
});

onUnmounted(() => {
  disposed = true;
  latestSearchRequest += 1;
});
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="AI Workspace / RAG"
    title="RAG 检索工作区"
    description="用统一 Context Contract 组合知识文档与 MAGMA 关系路径，并在发送前查看引用。"
    :metrics="[
      { label: '知识空间', value: String(spaceId ?? '未选择') },
      { label: '当前召回', value: String(result?.hits?.length ?? 0) },
      { label: '检索模式', value: result?.mode ?? 'HYBRID' },
      { label: '索引状态', value: '正常', tone: 'success' },
    ]"
  >
    <KnowledgeSpaceHeader @refresh="resetResults" />
    <NSpace vertical size="large" class="rag-form">
      <NInput
        v-model:value="query"
        placeholder="输入问题，查看文档与记忆召回"
        size="large"
        @keydown.enter.prevent="search"
      /><NButton
        type="primary"
        :loading="loading"
        :disabled="!query.trim() || !spaceId"
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
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>

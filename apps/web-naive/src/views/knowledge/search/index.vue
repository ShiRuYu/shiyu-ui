<script setup lang="ts">
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NEmpty, NInputNumber, NSelect, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import { searchKnowledge } from '#/api/knowledge/search';
import { useKnowledgeStore } from '#/store';
const store = useKnowledgeStore();
const { activeSpaceId, spaceOptions } = storeToRefs(store);
const query = ref('');
const topK = ref(5);
const mode = ref('HYBRID');
const rerank = ref(true);
const hits = ref<any[]>([]);
const loading = ref(false);
async function search() {
  if (!activeSpaceId.value || !query.value.trim()) return;
  loading.value = true;
  try {
    hits.value = (
      await searchKnowledge({
        spaceId: activeSpaceId.value,
        query: query.value,
        topK: topK.value,
        mode: mode.value,
        rerank: rerank.value,
      })
    ).hits;
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <Page
    title="检索评估"
    description="把检索从隐藏功能变成可验证的工作流：调整模式、召回数量和重排开关，观察结果质量。"
    >
<div class="grid gap-4 xl:grid-cols-[320px_1fr]">
      <NCard title="检索配置" :bordered="false"
        >
<div class="space-y-4">
          <NSelect
            v-model:value="activeSpaceId"
            :options="spaceOptions"
            placeholder="知识空间"
          /><NSelect
            v-model:value="mode"
            :options="[
              { label: '混合检索', value: 'HYBRID' },
              { label: '关键词检索', value: 'KEYWORD' },
              { label: '语义检索', value: 'SEMANTIC' },
            ]"
          /><NInputNumber
            v-model:value="topK"
            :min="1"
            :max="100"
            class="w-full"
          /><NButton type="primary" block :loading="loading" @click="search"
            >
开始检索
</NButton
          >
          <div class="text-xs leading-5 text-slate-500">
            建议用业务真实问题测试，不要只用知识点名称。结果中的
            BM25、Vector、RRF 分数可用于定位召回问题。
          </div>
        </div>
</NCard
      ><NCard title="检索结果" :bordered="false"
        >
<div v-if="hits.length" class="space-y-3">
          <div
            v-for="hit in hits"
            :key="hit.chunkId"
            class="rounded-lg border p-4"
          >
            <div class="flex justify-between gap-3">
              <b>文档 #{{ hit.documentId }} · Chunk #{{ hit.chunkId }}</b
              ><NTag size="small" type="success"
                >
RRF {{ hit.rrfScore.toFixed(3) }}
</NTag
              >
            </div>
            <div class="mt-3 text-sm leading-6 text-slate-600">
              {{ hit.highlight || hit.content }}
            </div>
            <div class="mt-3 text-xs text-slate-400">
              BM25 {{ hit.bm25Score.toFixed(3) }} · Vector
              {{ hit.vectorScore.toFixed(3) }} · Rerank
              {{ hit.rerankScore.toFixed(3) }}
            </div>
          </div>
        </div>
        <NEmpty v-else description="输入问题后查看召回结果" class="py-16"
      />
</NCard>
</div
  >
</Page>
</template>

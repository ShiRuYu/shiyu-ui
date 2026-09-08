<script setup lang="ts">
import type { HybridHit } from '#/features/knowledge/api';

import { onMounted, onUnmounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NCollapse,
  NCollapseItem,
  NEmpty,
  NInput,
  NInputNumber,
  NSelect,
  NSlider,
  NSwitch,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { searchKnowledge } from '#/features/knowledge/api';
import KnowledgeSpaceHeader from '#/features/knowledge/ui/knowledge-space-header.vue';
import { useKnowledgeStore } from '#/store';

const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const query = ref('');
const topK = ref(5);
const threshold = ref(0);
const mode = ref('HYBRID');
const rerank = ref(true);
const hits = ref<HybridHit[]>([]);
const loading = ref(false);
const searchError = ref(false);
const searched = ref(false);
const elapsed = ref(0);
let disposed = false;
let latestSearchRequest = 0;

async function search() {
  if (loading.value) return;
  const spaceId = activeSpaceId.value;
  if (!spaceId) {
    message.warning('请先选择知识空间');
    return;
  }
  if (!query.value.trim()) {
    message.warning('请输入要验证的问题');
    return;
  }
  const requestId = ++latestSearchRequest;
  loading.value = true;
  searchError.value = false;
  const startedAt = performance.now();
  try {
    const result = await searchKnowledge({
      mode: mode.value,
      query: query.value.trim(),
      rerank: rerank.value,
      spaceId,
      threshold: threshold.value || undefined,
      topK: topK.value,
    });
    if (disposed || requestId !== latestSearchRequest) return;
    hits.value = result.hits;
    searched.value = true;
    elapsed.value = Math.round(performance.now() - startedAt);
  } catch {
    if (disposed || requestId !== latestSearchRequest) return;
    searchError.value = true;
    message.error('检索失败，请稍后重试');
  } finally {
    if (!disposed && requestId === latestSearchRequest) loading.value = false;
  }
}
function resetResults() {
  latestSearchRequest += 1;
  loading.value = false;
  hits.value = [];
  searched.value = false;
  searchError.value = false;
}
function highlightedParts(content: string) {
  const terms = query.value
    .trim()
    .split(/\s+/)
    .filter((item) => item.length > 1);
  if (terms.length === 0) return [{ matched: false, text: content }];

  const pattern = new RegExp(
    terms
      .map((term) => term.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`))
      .join('|'),
    'gi',
  );
  const parts: Array<{ matched: boolean; text: string }> = [];
  let cursor = 0;
  for (const match of content.matchAll(pattern)) {
    const index = match.index ?? cursor;
    if (index > cursor) {
      parts.push({ matched: false, text: content.slice(cursor, index) });
    }
    parts.push({ matched: true, text: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < content.length) {
    parts.push({ matched: false, text: content.slice(cursor) });
  }
  return parts;
}
watch(activeSpaceId, resetResults);

onMounted(() => {
  void store.loadSpaces().catch(() => {
    if (!disposed) message.error('知识空间加载失败，请稍后重试');
  });
});

onUnmounted(() => {
  disposed = true;
  latestSearchRequest += 1;
});
</script>

<template>
  <Page
    title="检索评估"
    description="用真实业务问题验证召回质量，并逐项调节检索参数。"
  >
    <KnowledgeSpaceHeader @refresh="resetResults" />
    <NAlert v-if="searchError" type="warning" :bordered="false">
      检索服务暂时不可用，请调整参数后重试。
    </NAlert>
    <NCard :bordered="false">
      <div class="flex flex-col gap-3 lg:flex-row">
        <NInput
          v-model:value="query"
          type="textarea"
          autosize
          class="flex-1"
          placeholder="输入用户真实会问的问题，例如：新员工如何申请生产环境权限？"
          @keydown.ctrl.enter="search"
        />
        <NButton
          type="primary"
          class="lg:w-32"
          :loading="loading"
          @click="search"
        >
          开始检索
        </NButton>
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        按 Ctrl + Enter 可快速检索
      </div>
    </NCard>

    <div class="mt-4 grid gap-4 xl:grid-cols-[320px_1fr]">
      <NCard title="检索配置" :bordered="false">
        <div class="space-y-5">
          <div>
            <div class="mb-2 text-sm font-medium">检索模式</div>
            <NSelect
              v-model:value="mode"
              :options="[
                { label: '混合检索', value: 'HYBRID' },
                { label: '关键词检索', value: 'KEYWORD' },
                { label: '语义检索', value: 'SEMANTIC' },
              ]"
            />
          </div>
          <div>
            <div class="mb-2 flex justify-between text-sm">
              <span class="font-medium">召回数量</span><span>{{ topK }}</span>
            </div>
            <NInputNumber
              v-model:value="topK"
              :min="1"
              :max="100"
              class="w-full"
            />
          </div>
          <div>
            <div class="mb-2 flex justify-between text-sm">
              <span class="font-medium">最低相关度</span
              ><span>{{ threshold.toFixed(2) }}</span>
            </div>
            <NSlider v-model:value="threshold" :min="0" :max="1" :step="0.05" />
          </div>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium">启用重排</div>
              <div class="mt-1 text-xs text-muted-foreground">
                对初次召回结果再次排序
              </div>
            </div>
            <NSwitch v-model:value="rerank" />
          </div>
          <div
            class="rounded-lg bg-muted p-4 text-xs leading-5 text-muted-foreground"
          >
            建议使用业务真实问题而不是知识点名称。若结果缺失，先降低阈值或增加
            Top K；若排序不佳，再检查重排效果。
          </div>
        </div>
      </NCard>

      <NCard :bordered="false">
        <template #header>
          <div class="flex items-center justify-between">
            <span>检索结果</span>
            <span
              v-if="searched"
              class="text-xs font-normal text-muted-foreground"
              >{{ hits.length }} 条 · {{ elapsed }} ms</span
            >
          </div>
        </template>
        <div v-if="hits.length" class="space-y-4">
          <article
            v-for="(hit, index) in hits"
            :key="hit.chunkId"
            class="rounded-xl border p-5"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
                >
                  {{ index + 1 }}
                </div>
                <div>
                  <div class="font-medium">文档 #{{ hit.documentId }}</div>
                  <div class="mt-1 text-xs text-muted-foreground">
                    内容片段 #{{ hit.chunkId }}
                  </div>
                </div>
              </div>
              <NTag type="success" round>
                综合分 {{ hit.rrfScore.toFixed(3) }}
              </NTag>
            </div>
            <div class="mt-4 text-sm leading-7">
              <template
                v-for="(part, partIndex) in highlightedParts(
                  hit.highlight || hit.content,
                )"
                :key="`${hit.chunkId}-${partIndex}`"
              >
                <mark v-if="part.matched" class="rounded bg-warning/20 px-0.5">
                  {{ part.text }}
                </mark>
                <span v-else>{{ part.text }}</span>
              </template>
            </div>
            <NCollapse class="mt-3">
              <NCollapseItem title="查看调试分数" :name="hit.chunkId">
                <div
                  class="grid grid-cols-3 gap-2 text-xs text-muted-foreground"
                >
                  <div>关键词 {{ hit.bm25Score.toFixed(3) }}</div>
                  <div>向量 {{ hit.vectorScore.toFixed(3) }}</div>
                  <div>重排 {{ hit.rerankScore.toFixed(3) }}</div>
                </div>
              </NCollapseItem>
            </NCollapse>
          </article>
        </div>
        <NEmpty
          v-else
          :description="
            searched
              ? '没有达到当前阈值的结果，请调整参数后重试'
              : '输入问题后查看召回结果'
          "
          class="py-20"
        />
      </NCard>
    </div>
  </Page>
</template>

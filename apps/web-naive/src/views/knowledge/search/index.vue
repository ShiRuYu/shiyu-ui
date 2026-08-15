<script setup lang="ts">
import type { HybridHit } from '#/api/knowledge/enterprise';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
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

import { searchKnowledge } from '#/api/knowledge/search';
import { useKnowledgeStore } from '#/store';

import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';

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
const searched = ref(false);
const elapsed = ref(0);

async function search() {
  if (!activeSpaceId.value) {
    message.warning('请先选择知识空间');
    return;
  }
  if (!query.value.trim()) {
    message.warning('请输入要验证的问题');
    return;
  }
  loading.value = true;
  const startedAt = performance.now();
  try {
    const result = await searchKnowledge({
      mode: mode.value,
      query: query.value.trim(),
      rerank: rerank.value,
      spaceId: activeSpaceId.value,
      threshold: threshold.value || undefined,
      topK: topK.value,
    });
    hits.value = result.hits;
    searched.value = true;
    elapsed.value = Math.round(performance.now() - startedAt);
  } finally {
    loading.value = false;
  }
}
function resetResults() {
  hits.value = [];
  searched.value = false;
}
function highlight(content: string) {
  const escaped = content
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  const terms = query.value
    .trim()
    .split(/\s+/)
    .filter((item) => item.length > 1);
  let highlighted = escaped;
  for (const term of terms) {
    highlighted = highlighted.replaceAll(
      new RegExp(term.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`), 'gi'),
      (match) => `<mark class="rounded bg-warning/20 px-0.5">${match}</mark>`,
    );
  }
  return highlighted;
}
onMounted(() => store.loadSpaces());
</script>

<template>
  <Page
    title="检索评估"
    description="用真实业务问题验证召回质量，并逐项调节检索参数。"
  >
    <KnowledgeSpaceHeader @refresh="resetResults" />
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
            <div
              class="mt-4 text-sm leading-7"
              v-html="highlight(hit.highlight || hit.content)"
            ></div>
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

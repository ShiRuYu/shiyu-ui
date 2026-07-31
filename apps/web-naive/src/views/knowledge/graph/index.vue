<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NEmpty, NSelect, NSpin, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  getKnowledgePointGraph,
  getKnowledgePoints,
} from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';
const store = useKnowledgeStore();
const { activeSpaceId, spaceOptions } = storeToRefs(store);
const options = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<number>();
const graph = ref<any>();
const loading = ref(false);
const nodes = computed(() =>
  graph.value
    ? [
        graph.value.node,
        ...(graph.value.parentNodes || []),
        ...(graph.value.childNodes || []),
        ...(graph.value.relatedNodes || []),
      ].filter(Boolean)
    : [],
);
async function loadOptions() {
  if (!activeSpaceId.value) return;
  options.value = (
    await getKnowledgePoints(activeSpaceId.value, {
      pageNum: 1,
      pageSize: 1000,
    })
  ).items.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.id,
  }));
  if (!selectedId.value) selectedId.value = options.value[0]?.value;
}
async function loadGraph() {
  if (!selectedId.value) return;
  loading.value = true;
  try {
    graph.value = await getKnowledgePointGraph(selectedId.value);
  } finally {
    loading.value = false;
  }
}
async function changeSpace(value: number) {
  store.setActiveSpace(value);
  await loadOptions();
  await loadGraph();
}
onMounted(async () => {
  await store.loadSpaces();
  await loadOptions();
  await loadGraph();
});
</script>
<template>
  <Page
    title="图谱洞察"
    description="从全局结构观察知识网络，定位核心节点、孤立节点和关系密集区域。"
    >
<div class="grid gap-4 xl:grid-cols-[300px_1fr]">
      <NCard title="分析对象" :bordered="false"
        >
<div class="space-y-4">
          <NSelect
            :value="activeSpaceId"
            :options="spaceOptions"
            placeholder="知识空间"
            @update:value="changeSpace"
          /><NSelect
            v-model:value="selectedId"
            :options="options"
            filterable
            placeholder="选择中心知识点"
            @update:value="loadGraph"
          />
          <div class="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
            选择一个中心节点后，页面会展示它的前置、后续和关联知识。
          </div>
          <div class="flex flex-wrap gap-2">
            <NTag type="info">中心节点</NTag><NTag type="success">前置知识</NTag
            ><NTag type="warning">后续知识</NTag><NTag>关联知识</NTag>
          </div>
        </div>
</NCard
      ><NCard title="局部知识网络" :bordered="false"
        >
<NSpin :show="loading"
          >
<div
            v-if="nodes.length"
            class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div
              v-for="(node, index) in nodes"
              :key="`${node.id}-${index}`"
              class="rounded-xl border p-4"
              :class="
                index === 0
                  ? 'border-indigo-300 bg-indigo-50'
                  : 'border-slate-200'
              "
            >
              <div class="flex items-center justify-between">
                <b class="truncate">{{ node.name }}</b
                ><NTag size="small" :type="index === 0 ? 'info' : 'default'">
{{
                  index === 0 ? '中心' : '节点'
                }}
</NTag>
              </div>
              <div class="mt-2 text-xs text-slate-500">
                节点 ID：{{ node.id }}
              </div>
            </div>
          </div>
          <NEmpty v-else description="暂无图谱数据" class="py-16" />
</NSpin
      >
</NCard>
</div
  >
</Page>
</template>

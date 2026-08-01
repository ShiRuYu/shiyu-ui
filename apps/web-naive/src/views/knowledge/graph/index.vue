<script setup lang="ts">
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { NButton, NCard, NSelect, NSpin, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  findKnowledgePointPath,
  getKnowledgePointGraph,
  getKnowledgePoints,
  type KnowledgePoint,
} from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '../components/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';

interface PointGraph {
  childNodes?: KnowledgePoint[];
  node?: KnowledgePoint;
  parentNodes?: KnowledgePoint[];
  relatedNodes?: KnowledgePoint[];
}

const router = useRouter();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const options = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<number>();
const pathTargetId = ref<number>();
const pathIds = ref<number[]>([]);
const pathLoading = ref(false);
const selectedNode = ref<KnowledgePoint>();
const graph = ref<PointGraph>();
const loading = ref(false);
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const groups = computed(() => [
  {
    items: graph.value?.parentNodes || [],
    title: '前置知识',
    type: 'success' as const,
  },
  {
    items: graph.value?.childNodes || [],
    title: '后续知识',
    type: 'warning' as const,
  },
  {
    items: graph.value?.relatedNodes || [],
    title: '相关知识',
    type: 'info' as const,
  },
]);

async function loadOptions(reset = false) {
  if (!activeSpaceId.value) {
    options.value = [];
    selectedId.value = undefined;
    pathTargetId.value = undefined;
    pathIds.value = [];
    graph.value = undefined;
    return;
  }
  const result = await getKnowledgePoints(activeSpaceId.value, {
    pageNum: 1,
    pageSize: 500,
  });
  options.value = result.items.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.id,
  }));
  if (reset || !options.value.some((item) => item.value === selectedId.value)) {
    selectedId.value = options.value[0]?.value;
  }
  if (!options.value.some((item) => item.value === pathTargetId.value)) {
    pathTargetId.value = options.value.find(
      (item) => item.value !== selectedId.value,
    )?.value;
  }
}
async function loadGraph() {
  if (!selectedId.value) {
    graph.value = undefined;
    return;
  }
  loading.value = true;
  try {
    graph.value = (await getKnowledgePointGraph(
      selectedId.value,
    )) as PointGraph;
    selectedNode.value = graph.value.node;
    if (graph.value.node) {
      await nextTick();
      await renderGraph(graph.value);
    }
  } finally {
    loading.value = false;
  }
}
async function queryPath() {
  if (!selectedId.value || !pathTargetId.value) return;
  pathLoading.value = true;
  try {
    pathIds.value = await findKnowledgePointPath(
      selectedId.value,
      pathTargetId.value,
    );
  } finally {
    pathLoading.value = false;
  }
}
async function renderGraph(data: PointGraph) {
  if (!data.node) return;
  const nodes = [
    data.node,
    ...(data.parentNodes || []),
    ...(data.childNodes || []),
    ...(data.relatedNodes || []),
  ].filter(
    (node, index, all) =>
      all.findIndex((item) => item.id === node.id) === index,
  );
  const links: Array<{
    lineStyle?: { curveness: number };
    source: string;
    target: string;
  }> = [];
  const addLink = (source: number, target: number) => {
    if (
      !links.some(
        (link) =>
          link.source === String(source) && link.target === String(target),
      )
    ) {
      links.push({
        source: String(source),
        target: String(target),
        lineStyle: { curveness: 0.15 },
      });
    }
  };
  (data.parentNodes || []).forEach((node) => addLink(node.id, data.node!.id));
  (data.childNodes || []).forEach((node) => addLink(data.node!.id, node.id));
  (data.relatedNodes || []).forEach((node) => addLink(data.node!.id, node.id));
  const option: Parameters<typeof renderEcharts>[0] = {
    tooltip: { trigger: 'item' },
    animationDuration: 600,
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        data: nodes.map((node) => ({
          id: String(node.id),
          name: node.name,
          value: node.code,
          symbolSize: node.id === data.node!.id ? 58 : 38,
          itemStyle: {
            color: node.id === data.node!.id ? '#2563eb' : '#64748b',
          },
        })),
        links,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
        label: { show: true, position: 'bottom', formatter: '{b}' },
        emphasis: { focus: 'adjacency' },
        force: { repulsion: 260, edgeLength: [90, 180], gravity: 0.08 },
        lineStyle: { color: '#94a3b8', opacity: 0.8, width: 1.5 },
      },
    ],
  };
  await nextTick();
  for (let attempt = 0; attempt < 3 && !chartRef.value; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 40));
  }
  const chart = await renderEcharts(option);
  chart?.off('click');
  chart?.on('click', (params) => {
    const data = params.data as null | undefined | { id?: string };
    const node = nodes.find((item) => String(item.id) === data?.id);
    if (node) selectedNode.value = node;
  });
}
async function refresh(reset = false) {
  await loadOptions(reset);
  await loadGraph();
}
function chooseNode(node: KnowledgePoint) {
  selectedNode.value = node;
}
onMounted(async () => {
  await store.loadSpaces();
  await refresh(true);
});
</script>

<template>
  <Page
    title="图谱洞察"
    description="围绕中心节点查看前置、后续和横向关联，快速理解知识结构。"
  >
    <KnowledgeSpaceHeader :loading="loading" @refresh="refresh(true)" />
    <div class="grid gap-4 xl:grid-cols-[280px_1fr_300px]">
      <NCard title="分析对象" :bordered="false">
        <NSelect
          v-model:value="selectedId"
          :options="options"
          filterable
          placeholder="选择中心知识点"
          @update:value="loadGraph"
        />
        <div class="mt-5 border-t pt-4">
          <div class="mb-2 text-sm font-medium">路径查询</div>
          <NSelect
            v-model:value="pathTargetId"
            :options="options"
            filterable
            placeholder="选择目标知识点"
          />
          <NButton
            class="mt-2"
            block
            :loading="pathLoading"
            :disabled="!selectedId || !pathTargetId"
            @click="queryPath"
          >
            查询最短路径
          </NButton>
          <div
            v-if="pathIds.length"
            class="mt-3 rounded-lg bg-primary/5 p-3 text-xs leading-6"
          >
            <div class="font-medium">路径节点（{{ pathIds.length }}）</div>
            <div>{{ pathIds.join(' → ') }}</div>
          </div>
          <div v-else class="mt-2 text-xs text-muted-foreground">
            路径查询结果会显示在这里
          </div>
        </div>
        <div class="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          点击网络中的节点可查看详情，也可以直接进入关系编排维护结构。
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <NTag type="primary">中心</NTag><NTag type="success">前置</NTag
          ><NTag type="warning">后续</NTag><NTag type="info">相关</NTag>
        </div>
      </NCard>

      <NCard title="局部知识网络" :bordered="false">
        <NSpin :show="loading">
          <div v-if="graph?.node" class="space-y-6">
            <div class="h-[520px] w-full rounded-xl border bg-muted/20 p-2">
              <EchartsUI ref="chartRef" height="100%" />
            </div>
            <div class="flex justify-center">
              <button
                class="min-w-56 rounded-2xl border-2 border-primary bg-primary/10 p-5 text-center shadow-sm"
                @click="chooseNode(graph.node!)"
              >
                <NTag size="small" type="primary">中心知识点</NTag>
                <div class="mt-2 text-lg font-semibold">
                  {{ graph.node.name }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ graph.node.code }}
                </div>
              </button>
            </div>
            <div class="grid gap-5 lg:grid-cols-3">
              <section v-for="group in groups" :key="group.title">
                <div class="mb-3 flex items-center justify-between">
                  <NTag :type="group.type">{{ group.title }}</NTag
                  ><span class="text-xs text-muted-foreground"
                    >{{ group.items.length }} 个</span
                  >
                </div>
                <div class="space-y-2">
                  <button
                    v-for="node in group.items"
                    :key="node.id"
                    class="w-full rounded-xl border p-3 text-left transition hover:border-primary hover:shadow-sm"
                    @click="chooseNode(node)"
                  >
                    <div class="font-medium">{{ node.name }}</div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ node.code }}
                    </div>
                  </button>
                  <div
                    v-if="!group.items.length"
                    class="rounded-xl border border-dashed p-5 text-center text-xs text-muted-foreground"
                  >
                    暂无{{ group.title }}
                  </div>
                </div>
              </section>
            </div>
          </div>
          <KnowledgeEmptyState
            v-else
            description="当前空间暂无可展示的图谱数据"
            action-text="维护知识关系"
            @action="router.push('/knowledge/relations')"
          />
        </NSpin>
      </NCard>

      <NCard title="节点详情" :bordered="false">
        <template v-if="selectedNode">
          <div class="text-lg font-semibold">{{ selectedNode.name }}</div>
          <div class="mt-1 text-sm text-muted-foreground">
            {{ selectedNode.code }}
          </div>
          <div class="mt-4 space-y-3 text-sm">
            <div>
              <span class="text-muted-foreground">分类：</span
              >{{ selectedNode.category || '-' }}
            </div>
            <div>
              <span class="text-muted-foreground">难度：</span
              >{{ selectedNode.difficultyLevel ?? '-' }}
            </div>
            <div>
              <span class="text-muted-foreground">标签：</span
              >{{ selectedNode.tags || '-' }}
            </div>
            <div>
              <span class="text-muted-foreground">描述：</span>
              <p class="mt-1 leading-6">
                {{ selectedNode.description || '暂无描述' }}
              </p>
            </div>
          </div>
          <NButton
            class="mt-5"
            type="primary"
            block
            @click="
              router.push({
                path: '/knowledge/relations',
                query: { pointId: selectedNode.id },
              })
            "
          >
            编辑该节点关系
          </NButton>
        </template>
        <KnowledgeEmptyState v-else description="点击节点查看详情" />
      </NCard>
    </div>
  </Page>
</template>

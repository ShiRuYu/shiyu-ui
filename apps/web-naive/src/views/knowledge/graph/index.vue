<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInputNumber,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  findKnowledgePointPath,
  getKnowledgePointGraph,
  getKnowledgePoints,
  type KnowledgePoint,
} from '#/api/knowledge/point';
import {
  createKnowledgeRelation,
  deleteKnowledgeRelation,
  getKnowledgeRelations,
  type KnowledgeRelation,
} from '#/api/knowledge/relation';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '../components/knowledge-empty-state.vue';
import KnowledgeGraphCanvas, {
  type KnowledgeGraphEdge,
  type KnowledgeGraphNode,
} from '../components/knowledge-graph-canvas.vue';
import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';

interface PointGraph {
  childNodes?: KnowledgePoint[];
  node?: KnowledgePoint;
  parentNodes?: KnowledgePoint[];
  relatedNodes?: KnowledgePoint[];
}

const router = useRouter();
const route = useRoute();
const message = useMessage();
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
const relations = ref<KnowledgeRelation[]>([]);
const graphCanvasKey = ref(0);
type GraphGroup = 'center' | 'child' | 'parent' | 'related';

function comparePoints(left: KnowledgePoint, right: KnowledgePoint) {
  return (
    left.code.localeCompare(right.code, 'zh-CN') ||
    left.name.localeCompare(right.name, 'zh-CN') ||
    left.id - right.id
  );
}

function toPoint(node: { code: string; id: number; name: string }) {
  return {
    code: node.code,
    id: node.id,
    name: node.name,
    spaceId: activeSpaceId.value ?? 0,
  } satisfies KnowledgePoint;
}

function uniqueSortedPoints(points: KnowledgePoint[]) {
  return [...new Map(points.map((point) => [point.id, point])).values()].sort(
    comparePoints,
  );
}

const pointGroups = computed<Record<GraphGroup, KnowledgePoint[]>>(() => {
  const center = graph.value?.node;
  if (!center) return { center: [], parent: [], child: [], related: [] };

  const parent = [...(graph.value?.parentNodes || [])];
  const child = [...(graph.value?.childNodes || [])];
  const related = [...(graph.value?.relatedNodes || [])];
  for (const relation of relations.value) {
    const relationNode =
      relation.sourceId === center.id ? relation.target : relation.source;
    if (!relationNode || relationNode.id === center.id) continue;
    const point = toPoint(relationNode);
    if (relation.relationType === 'PRE') {
      if (relation.targetId === center.id) child.push(point);
      else if (relation.sourceId === center.id) parent.push(point);
    } else if (relation.relationType === 'RELATED') {
      related.push(point);
    }
  }

  return {
    center: [center],
    parent: uniqueSortedPoints(parent),
    child: uniqueSortedPoints(child),
    related: uniqueSortedPoints(related),
  };
});

const flowNodes = computed<KnowledgeGraphNode[]>(() => {
  const groups: Array<[GraphGroup, KnowledgePoint[]]> = [
    ['center', pointGroups.value.center],
    ['parent', pointGroups.value.parent],
    ['child', pointGroups.value.child],
    ['related', pointGroups.value.related],
  ];
  return groups.flatMap(([group, points]) =>
    points.map((point) => ({
      code: point.code,
      group,
      id: point.id,
      name: point.name,
    })),
  );
});
const flowEdges = computed<KnowledgeGraphEdge[]>(() => {
  const nodeIds = new Set(flowNodes.value.map((node) => node.id));
  const direct = relations.value
    .filter(
      (relation) =>
        nodeIds.has(relation.sourceId) && nodeIds.has(relation.targetId),
    )
    .map((relation) => ({
      id: `${relation.sourceId}->${relation.targetId}:${relation.relationType}`,
      relationType: relation.relationType,
      source: relation.sourceId,
      target: relation.targetId,
      weight: relation.weight,
    }));
  if (direct.length) return direct;
  const fallback: KnowledgeGraphEdge[] = [];
  pointGroups.value.parent.forEach((node) =>
    fallback.push({
      id: `${node.id}->${graph.value!.node!.id}:PRE`,
      relationType: 'PRE',
      source: node.id,
      target: graph.value!.node!.id,
    }),
  );
  pointGroups.value.child.forEach((node) =>
    fallback.push({
      id: `${graph.value!.node!.id}->${node.id}:PRE`,
      relationType: 'PRE',
      source: graph.value!.node!.id,
      target: node.id,
    }),
  );
  pointGroups.value.related.forEach((node) =>
    fallback.push({
      id: `${graph.value!.node!.id}->${node.id}:RELATED`,
      relationType: 'RELATED',
      source: graph.value!.node!.id,
      target: node.id,
    }),
  );
  return fallback;
});
const relationModalVisible = ref(false);
const relationEditing = ref(false);
const relationSourceId = ref<number>();
const relationTargetId = ref<number>();
const relationType = ref('PRE');
const relationOriginalType = ref('PRE');
const relationWeight = ref(1);
const relationSaving = ref(false);
const relationTypeOptions = [
  { label: '前置关系', value: 'PRE' },
  { label: '相关关系', value: 'RELATED' },
];
const groups = computed(() => [
  {
    items: pointGroups.value.parent,
    title: '前置知识',
    type: 'success' as const,
  },
  {
    items: pointGroups.value.child,
    title: '后续知识',
    type: 'warning' as const,
  },
  {
    items: pointGroups.value.related,
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
    const queryId = Number(route.query.pointId);
    selectedId.value = options.value.some((item) => item.value === queryId)
      ? queryId
      : options.value[0]?.value;
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
    const [graphResult, relationResult] = await Promise.all([
      getKnowledgePointGraph(selectedId.value),
      getKnowledgeRelations(selectedId.value),
    ]);
    graph.value = graphResult as PointGraph;
    relations.value = relationResult || [];
    selectedNode.value = graph.value.node;
    graphCanvasKey.value += 1;
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
async function refresh(reset = false) {
  await loadOptions(reset);
  await loadGraph();
}
function chooseNode(node: KnowledgePoint) {
  selectedNode.value = node;
}

function handleGraphNodeSelect(nodeId: number) {
  const node =
    [
      ...pointGroups.value.parent,
      ...pointGroups.value.child,
      ...pointGroups.value.related,
    ].find((item) => item.id === nodeId) ||
    pointGroups.value.center.find((item) => item.id === nodeId);
  if (node) selectedNode.value = node;
}

function openCreateRelation(value: { sourceId: number; targetId: number }) {
  const { sourceId, targetId } = value;
  if (sourceId === targetId) return;
  relationEditing.value = false;
  relationSourceId.value = sourceId;
  relationTargetId.value = targetId;
  relationType.value = 'PRE';
  relationOriginalType.value = 'PRE';
  relationWeight.value = 1;
  relationModalVisible.value = true;
}

function openCreateRelationFromSelection() {
  const sourceId = selectedId.value ?? options.value[0]?.value;
  const targetId = options.value.find(
    (option) => option.value !== sourceId,
  )?.value;
  if (!sourceId || !targetId) {
    message.info('至少需要两个知识点才能建立关系');
    return;
  }
  openCreateRelation({ sourceId, targetId });
}

function openEditRelation(edge: KnowledgeGraphEdge) {
  const relation = relations.value.find(
    (item) =>
      item.sourceId === edge.source &&
      item.targetId === edge.target &&
      item.relationType === edge.relationType,
  );
  if (!relation) {
    message.info('该方向关系来自图谱推导，请通过真实关系连线编辑');
    return;
  }
  relationEditing.value = true;
  relationSourceId.value = relation.sourceId;
  relationTargetId.value = relation.targetId;
  relationType.value = relation.relationType;
  relationOriginalType.value = relation.relationType;
  relationWeight.value = relation.weight ?? 1;
  relationModalVisible.value = true;
}

async function saveRelation() {
  if (!relationSourceId.value || !relationTargetId.value) return;
  relationSaving.value = true;
  try {
    if (relationEditing.value) {
      await deleteKnowledgeRelation(
        relationSourceId.value,
        relationTargetId.value,
        relationOriginalType.value,
      );
    }
    await createKnowledgeRelation({
      sourceId: relationSourceId.value,
      targetId: relationTargetId.value,
      type: relationType.value,
      weight: relationWeight.value,
    });
    message.success('关系已保存');
    relationModalVisible.value = false;
    await loadGraph();
  } finally {
    relationSaving.value = false;
  }
}

async function removeRelation() {
  if (!relationSourceId.value || !relationTargetId.value) return;
  relationSaving.value = true;
  try {
    await deleteKnowledgeRelation(
      relationSourceId.value,
      relationTargetId.value,
      relationOriginalType.value,
    );
    message.success('关系已删除');
    relationModalVisible.value = false;
    await loadGraph();
  } finally {
    relationSaving.value = false;
  }
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
        <NButton
          class="mt-3"
          block
          type="primary"
          :disabled="options.length < 2"
          @click="openCreateRelationFromSelection"
        >
          新增关系
        </NButton>
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
          在图中拖拽节点之间的连线即可编排关系；点击连线可以修改或删除关系。
        </div>
        <div class="mt-4 flex flex-wrap gap-2">
          <NTag type="primary">中心</NTag><NTag type="success">前置</NTag
          ><NTag type="warning">后续</NTag><NTag type="info">相关</NTag>
        </div>
      </NCard>

      <NCard title="局部知识网络" :bordered="false">
        <NSpin :show="loading">
          <div v-if="graph?.node" class="space-y-6">
            <div
              class="h-[560px] w-full overflow-hidden rounded-xl border bg-muted/20"
            >
              <KnowledgeGraphCanvas
                :key="graphCanvasKey"
                :edges="flowEdges"
                :nodes="flowNodes"
                :selected-id="selectedId"
                @connect="openCreateRelation"
                @select-edge="openEditRelation"
                @select-node="handleGraphNodeSelect"
              />
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
            @action="router.push('/knowledge/graph')"
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
              selectedId = selectedNode.id;
              loadGraph();
            "
          >
            刷新该节点关系
          </NButton>
        </template>
        <KnowledgeEmptyState v-else description="点击节点查看详情" />
      </NCard>
    </div>
  </Page>

  <NModal
    v-model:show="relationModalVisible"
    preset="card"
    title="图上关系编排"
    class="w-[420px]"
  >
    <NForm label-placement="top">
      <NFormItem label="关系来源">
        <NSelect
          v-model:value="relationSourceId"
          :options="options"
          :disabled="relationEditing"
        />
      </NFormItem>
      <NFormItem label="关系目标">
        <NSelect
          v-model:value="relationTargetId"
          :options="options"
          :disabled="relationEditing"
        />
      </NFormItem>
      <NFormItem label="关系类型">
        <NSelect v-model:value="relationType" :options="relationTypeOptions" />
      </NFormItem>
      <NFormItem label="权重">
        <NInputNumber
          v-model:value="relationWeight"
          :max="10"
          :min="0"
          :step="0.1"
        />
      </NFormItem>
    </NForm>
    <template #footer>
      <NSpace justify="end">
        <NButton
          v-if="relationEditing"
          type="error"
          :loading="relationSaving"
          @click="removeRelation"
        >
          删除关系
        </NButton>
        <NButton @click="relationModalVisible = false">取消</NButton>
        <NButton type="primary" :loading="relationSaving" @click="saveRelation">
          保存关系
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

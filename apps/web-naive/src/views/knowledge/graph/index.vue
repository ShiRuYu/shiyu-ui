<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

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

const route = useRoute();
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const options = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<number>();
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
    const relationType = relation.relationType.toUpperCase();
    if (['BELONG', 'PRE'].includes(relationType)) {
      if (relation.sourceId === center.id) parent.push(point);
      else if (relation.targetId === center.id) child.push(point);
    } else if (['INCLUDE', 'NEXT'].includes(relationType)) {
      if (relation.sourceId === center.id) child.push(point);
      else if (relation.targetId === center.id) parent.push(point);
    } else {
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

const relationTypeMeta: Record<
  string,
  {
    description: string;
    label: string;
    tagType: 'default' | 'info' | 'primary' | 'success' | 'warning';
  }
> = {
  PRE: {
    description: '目标知识依赖当前知识',
    label: '前置',
    tagType: 'success',
  },
  NEXT: {
    description: '目标知识适合在当前知识之后学习',
    label: '后续',
    tagType: 'warning',
  },
  INCLUDE: {
    description: '当前知识包含目标知识',
    label: '包含',
    tagType: 'primary',
  },
  RELATED: {
    description: '两个知识点存在横向关联',
    label: '相关',
    tagType: 'info',
  },
  SIMILAR: {
    description: '两个知识点内容或语义相似',
    label: '相似',
    tagType: 'info',
  },
  BELONG: {
    description: '当前知识归属于目标知识',
    label: '归属',
    tagType: 'default',
  },
};

const relationTypeOptions = Object.entries(relationTypeMeta).map(
  ([value, meta]) => ({
    label: `${meta.label}：${meta.description}`,
    value,
  }),
);

function relationLabel(type: string) {
  return relationTypeMeta[type.toUpperCase()]?.label || type;
}

function relationTagType(type: string) {
  return relationTypeMeta[type.toUpperCase()]?.tagType || 'default';
}

function relationDirection(
  relationType: string,
  sourceId: number,
  targetId: number,
  centerId?: number,
): KnowledgeGraphEdge['direction'] {
  if (!centerId || ['RELATED', 'SIMILAR'].includes(relationType)) {
    return 'related';
  }
  if (sourceId === centerId) {
    return ['BELONG', 'PRE'].includes(relationType) ? 'parent' : 'child';
  }
  if (targetId === centerId) {
    return ['BELONG', 'PRE'].includes(relationType) ? 'child' : 'parent';
  }
  return 'related';
}

const selectedRelations = computed(() => {
  const nodeId = selectedNode.value?.id;
  if (!nodeId) return [];
  return [...relations.value]
    .filter(
      (relation) =>
        relation.sourceId === nodeId || relation.targetId === nodeId,
    )
    .sort((left, right) => {
      const typeCompare = relationLabel(left.relationType).localeCompare(
        relationLabel(right.relationType),
        'zh-CN',
      );
      return (
        typeCompare ||
        left.sourceId - right.sourceId ||
        left.targetId - right.targetId
      );
    });
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
      direction: relationDirection(
        relation.relationType.toUpperCase(),
        relation.sourceId,
        relation.targetId,
        graph.value?.node?.id,
      ),
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
      direction: 'child',
      source: node.id,
      target: graph.value!.node!.id,
    }),
  );
  pointGroups.value.child.forEach((node) =>
    fallback.push({
      id: `${graph.value!.node!.id}->${node.id}:PRE`,
      relationType: 'PRE',
      direction: 'parent',
      source: graph.value!.node!.id,
      target: node.id,
    }),
  );
  pointGroups.value.related.forEach((node) =>
    fallback.push({
      id: `${graph.value!.node!.id}->${node.id}:RELATED`,
      relationType: 'RELATED',
      direction: 'related',
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

async function loadOptions(reset = false) {
  if (!activeSpaceId.value) {
    options.value = [];
    selectedId.value = undefined;
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
async function refresh(reset = false) {
  await loadOptions(reset);
  await loadGraph();
}
async function handleGraphNodeSelect(nodeId: number) {
  const node =
    [
      ...pointGroups.value.parent,
      ...pointGroups.value.child,
      ...pointGroups.value.related,
    ].find((item) => item.id === nodeId) ||
    pointGroups.value.center.find((item) => item.id === nodeId);
  if (!node) return;
  selectedNode.value = node;
  if (selectedId.value !== nodeId) {
    selectedId.value = nodeId;
    await loadGraph();
  }
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
  const sourceId = selectedNode.value?.id ?? selectedId.value;
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
  editRelation(relation);
}

function editRelation(relation: KnowledgeRelation) {
  relationEditing.value = true;
  relationSourceId.value = relation.sourceId;
  relationTargetId.value = relation.targetId;
  relationType.value = relation.relationType;
  relationOriginalType.value = relation.relationType;
  relationWeight.value = relation.weight ?? 1;
  relationModalVisible.value = true;
}

async function removeRelationValue(relation: KnowledgeRelation) {
  relationSourceId.value = relation.sourceId;
  relationTargetId.value = relation.targetId;
  relationOriginalType.value = relation.relationType;
  await removeRelation();
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
    <div class="grid gap-4 xl:grid-cols-[220px_1fr_360px]">
      <NCard title="图谱导航" :bordered="false">
        <NSelect
          v-model:value="selectedId"
          :options="options"
          filterable
          placeholder="选择中心知识点"
          @update:value="loadGraph"
        />
        <div class="mt-4 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          点击图中节点切换分析中心，关系新增、编辑和删除统一在右侧节点详情中完成。
        </div>
        <div class="mt-4 space-y-2">
          <div class="text-xs font-medium text-muted-foreground">关系类型</div>
          <div class="flex flex-wrap gap-2">
            <NTag
              v-for="option in relationTypeOptions"
              :key="option.value"
              size="small"
              :type="relationTagType(option.value)"
            >
              {{ relationLabel(option.value) }}
            </NTag>
          </div>
        </div>
      </NCard>

      <NCard title="局部知识网络" :bordered="false">
        <NSpin :show="loading">
          <div
            v-if="graph?.node"
            class="h-[680px] w-full overflow-hidden rounded-xl border bg-muted/20"
          >
            <KnowledgeGraphCanvas
              :key="graphCanvasKey"
              :edges="flowEdges"
              :nodes="flowNodes"
              :selected-id="selectedId"
              @select-edge="openEditRelation"
              @select-node="handleGraphNodeSelect"
            />
          </div>
          <KnowledgeEmptyState
            v-else
            description="当前空间暂无可展示的图谱数据"
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
            :disabled="options.length < 2"
            @click="openCreateRelationFromSelection"
          >
            新增关系
          </NButton>
          <div class="mt-5 border-t pt-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="font-medium">节点关系</div>
              <span class="text-xs text-muted-foreground"
                >{{ selectedRelations.length }} 条</span
              >
            </div>
            <div v-if="selectedRelations.length" class="space-y-2">
              <div
                v-for="relation in selectedRelations"
                :key="`${relation.sourceId}-${relation.targetId}-${relation.relationType}`"
                class="rounded-lg border p-3"
              >
                <div class="flex items-center justify-between gap-2">
                  <NTag
                    size="small"
                    :type="relationTagType(relation.relationType)"
                  >
                    {{ relationLabel(relation.relationType) }}
                  </NTag>
                  <span class="text-xs text-muted-foreground"
                    >权重 {{ relation.weight ?? 1 }}</span
                  >
                </div>
                <div class="mt-2 text-sm leading-5">
                  {{ relation.source?.name || relation.sourceId }}
                  <span class="px-1 text-muted-foreground">→</span>
                  {{ relation.target?.name || relation.targetId }}
                </div>
                <div class="mt-2 flex justify-end gap-2">
                  <NButton
                    size="small"
                    secondary
                    @click="editRelation(relation)"
                  >
                    编辑
                  </NButton>
                  <NButton
                    size="small"
                    secondary
                    type="error"
                    :loading="relationSaving"
                    @click="removeRelationValue(relation)"
                  >
                    删除
                  </NButton>
                </div>
              </div>
            </div>
            <div
              v-else
              class="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground"
            >
              当前节点暂无关系
            </div>
          </div>
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

<script lang="ts" setup>
import type { Edge, Node } from '@vue-flow/core';

import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';

import { Background } from '@vue-flow/background';
import { MarkerType, useVueFlow, VueFlow } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

export interface KnowledgeGraphNode {
  code: string;
  group?: 'center' | 'child' | 'parent' | 'related';
  id: number;
  name: string;
}

export interface KnowledgeGraphEdge {
  direction?: 'child' | 'parent' | 'related';
  id: string;
  relationType?: string;
  source: number;
  target: number;
  weight?: number;
}

const props = defineProps<{
  edges: KnowledgeGraphEdge[];
  nodes: KnowledgeGraphNode[];
  selectedId?: number;
}>();

const emit = defineEmits<{
  (e: 'selectEdge', edge: KnowledgeGraphEdge): void;
  (e: 'selectNode', nodeId: number): void;
}>();

const flowNodes = shallowRef<Node[]>([]);
const flowEdges = shallowRef<Edge[]>([]);
const canvasRoot = ref<HTMLElement>();
const isFullscreen = ref(false);
const { fitView, zoomIn, zoomOut } = useVueFlow();
const relationLabels: Record<string, string> = {
  BELONG: '归属',
  INCLUDE: '包含',
  NEXT: '后续',
  PRE: '前置',
  RELATED: '相关',
  SIMILAR: '相似',
};

async function syncGraph() {
  flowNodes.value = props.nodes.map((node, index) => ({
    id: String(node.id),
    type: 'default',
    label: node.name || node.code,
    position: {
      x: positionFor(node, index).x,
      y: positionFor(node, index).y,
    },
    class:
      node.id === props.selectedId
        ? 'knowledge-graph-node knowledge-graph-node-selected'
        : 'knowledge-graph-node',
    data: node,
  }));
  flowEdges.value = props.edges.map((edge) => ({
    id: edge.id,
    source: String(edge.source),
    target: String(edge.target),
    label: edge.relationType || '关系',
    markerEnd: MarkerType.ArrowClosed,
    data: edge,
  }));
  flowEdges.value = flowEdges.value.map((flowEdge) => {
    const edge = flowEdge.data as KnowledgeGraphEdge;
    const color =
      edge.direction === 'parent'
        ? '#16a34a'
        : edge.direction === 'child'
          ? '#d97706'
          : '#2563eb';
    const label =
      relationLabels[edge.relationType?.toUpperCase() || ''] ||
      (edge.direction === 'parent'
        ? '前置'
        : edge.direction === 'child'
          ? '后续'
          : edge.direction === 'related'
            ? '相关'
            : edge.relationType || '关系');
    return {
      ...flowEdge,
      type: edge.direction === 'related' ? 'default' : 'smoothstep',
      label,
      labelShowBg: true,
      labelBgPadding: [6, 3] as [number, number],
      labelBgBorderRadius: 4,
      labelBgStyle: {
        fill: '#ffffff',
        fillOpacity: 0.96,
        stroke: color,
        strokeWidth: 1,
      },
      labelStyle: {
        fill: color,
        fontSize: '12px',
        fontWeight: '600',
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color,
        width: 18,
        height: 18,
      },
      style: {
        stroke: color,
        strokeDasharray: edge.direction === 'related' ? '7 5' : undefined,
        strokeWidth: 2.5,
      },
      zIndex: edge.direction === 'related' ? 1 : 2,
    };
  });
  await nextTick();
  try {
    await fitView({ padding: 0.2 });
  } catch {
    // The first immediate watcher can run before Vue Flow is mounted.
  }
}

function positionFor(node: KnowledgeGraphNode, index: number) {
  const groupedIndex = props.nodes
    .slice(0, index)
    .filter((item) => item.group === node.group).length;
  const groupSize = props.nodes.filter(
    (item) => item.group === node.group,
  ).length;
  if (node.group === 'center') return { x: 350, y: 240 };
  if (node.group === 'parent') return { x: 70, y: 80 + groupedIndex * 150 };
  if (node.group === 'child') return { x: 650, y: 80 + groupedIndex * 150 };
  if (node.group === 'related') {
    const width = Math.max(1, Math.min(groupSize, 4));
    return {
      x: 250 + (groupedIndex % width) * 210,
      y: 470 + Math.floor(groupedIndex / width) * 140,
    };
  }
  return { x: 350 + (index % 3) * 220, y: 80 + Math.floor(index / 3) * 150 };
}

watch(() => [props.nodes, props.edges, props.selectedId], syncGraph, {
  deep: true,
  immediate: true,
});

function handleNodeClick({ node }: { node: Node }) {
  const id = Number(node.id);
  if (id) emit('selectNode', id);
}

function handleEdgeClick({ edge }: { edge: Edge }) {
  const data = edge.data as KnowledgeGraphEdge | undefined;
  const value = data || props.edges.find((item) => item.id === edge.id);
  if (value) emit('selectEdge', value);
}

async function toggleFullscreen() {
  if (!canvasRoot.value) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  await canvasRoot.value.requestFullscreen();
}

function handleFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === canvasRoot.value;
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});
</script>

<template>
  <div
    ref="canvasRoot"
    class="knowledge-graph-canvas relative h-full min-h-[560px] w-full"
    :class="{ 'knowledge-graph-canvas-fullscreen': isFullscreen }"
  >
    <div
      class="absolute right-4 top-4 z-10 flex items-center gap-1 rounded-lg border bg-white/95 p-1 shadow-sm dark:bg-slate-900/95"
      role="toolbar"
      aria-label="图谱视图工具"
    >
      <button
        class="graph-tool-button"
        type="button"
        title="放大"
        aria-label="放大"
        data-testid="knowledge-graph-zoom-in"
        @click="() => zoomIn()"
      >
        +
      </button>
      <button
        class="graph-tool-button"
        type="button"
        title="缩小"
        aria-label="缩小"
        data-testid="knowledge-graph-zoom-out"
        @click="() => zoomOut()"
      >
        −
      </button>
      <button
        class="graph-tool-button graph-tool-button-wide"
        type="button"
        title="适应画布"
        aria-label="适应画布"
        data-testid="knowledge-graph-fit-view"
        @click="fitView({ padding: 0.2 })"
      >
        适应
      </button>
      <button
        class="graph-tool-button graph-tool-button-wide"
        type="button"
        :title="isFullscreen ? '退出全屏' : '全屏'"
        :aria-label="isFullscreen ? '退出全屏' : '全屏'"
        data-testid="knowledge-graph-fullscreen"
        @click="toggleFullscreen"
      >
        {{ isFullscreen ? '退出' : '全屏' }}
      </button>
    </div>
    <VueFlow
      :edges="flowEdges"
      :nodes="flowNodes"
      :elements-selectable="true"
      :nodes-connectable="false"
      :nodes-draggable="true"
      fit-view-on-init
      @edge-click="handleEdgeClick"
      @node-click="handleNodeClick"
    >
      <Background pattern-color="#cbd5e1" :gap="20" />
      <MiniMap pannable zoomable />
    </VueFlow>
  </div>
</template>

<style scoped>
.knowledge-graph-canvas :deep(.vue-flow__node) {
  min-width: 150px;
  border: 1px solid #94a3b8;
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 2px 8px rgb(15 23 42 / 8%);
}

.knowledge-graph-canvas :deep(.knowledge-graph-node-selected) {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgb(37 99 235 / 18%);
}

.knowledge-graph-canvas :deep(.vue-flow__edge-text) {
  fill: #475569;
  font-size: 11px;
}

.knowledge-graph-canvas-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  min-height: 100vh;
  background: #fff;
}

.knowledge-graph-canvas:fullscreen {
  min-height: 100vh;
  background: #fff;
}

.graph-tool-button {
  display: inline-flex;
  min-width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.graph-tool-button:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.graph-tool-button-wide {
  padding: 0 8px;
  font-size: 12px;
}
</style>

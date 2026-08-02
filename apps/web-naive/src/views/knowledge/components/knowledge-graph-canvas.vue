<script lang="ts" setup>
import type { Connection, Edge, Node } from '@vue-flow/core';

import { nextTick, shallowRef, watch } from 'vue';

import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
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
  readonly?: boolean;
  selectedId?: number;
}>();

const emit = defineEmits<{
  (e: 'connect', value: { sourceId: number; targetId: number }): void;
  (e: 'selectEdge', edge: KnowledgeGraphEdge): void;
  (e: 'selectNode', nodeId: number): void;
}>();

const flowNodes = shallowRef<Node[]>([]);
const flowEdges = shallowRef<Edge[]>([]);
const { fitView } = useVueFlow();

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
      edge.direction === 'parent'
        ? '前置'
        : edge.direction === 'child'
          ? '后置'
          : edge.direction === 'related'
            ? '相关'
            : edge.relationType || '关系';
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

function handleConnect(connection: Connection) {
  if (
    props.readonly ||
    !connection.source ||
    !connection.target ||
    connection.source === connection.target
  ) {
    return;
  }
  emit('connect', {
    sourceId: Number(connection.source),
    targetId: Number(connection.target),
  });
}
</script>

<template>
  <div class="knowledge-graph-canvas h-full min-h-[560px] w-full">
    <VueFlow
      :edges="flowEdges"
      :nodes="flowNodes"
      :elements-selectable="true"
      :nodes-connectable="!readonly"
      :nodes-draggable="true"
      fit-view-on-init
      @connect="handleConnect"
      @edge-click="handleEdgeClick"
      @node-click="handleNodeClick"
    >
      <Background pattern-color="#cbd5e1" :gap="20" />
      <MiniMap pannable zoomable />
      <Controls />
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
</style>

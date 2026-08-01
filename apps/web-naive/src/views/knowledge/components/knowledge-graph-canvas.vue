<script lang="ts" setup>
import type { Connection, Edge, Node } from '@vue-flow/core';

import { shallowRef, watch } from 'vue';

import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MarkerType, VueFlow } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

export interface KnowledgeGraphNode {
  code: string;
  id: number;
  name: string;
}

export interface KnowledgeGraphEdge {
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

function syncGraph() {
  flowNodes.value = props.nodes.map((node, index) => ({
    id: String(node.id),
    type: 'default',
    label: node.name || node.code,
    position: {
      x: 80 + (index % 3) * 260,
      y: 80 + Math.floor(index / 3) * 170,
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
      v-model:edges="flowEdges"
      v-model:nodes="flowNodes"
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

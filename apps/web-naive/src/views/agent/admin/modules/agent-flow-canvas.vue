<script lang="ts" setup>
import type { Connection, Edge, Node } from '@vue-flow/core';

import type { AgentGraphApi } from '#/api/agent/graph';

import { ref, watch } from 'vue';

import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { addEdge, MarkerType, VueFlow } from '@vue-flow/core';
import { MiniMap } from '@vue-flow/minimap';
import { NButton, NSpace } from 'naive-ui';

import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';

const props = defineProps<{
  edges: AgentGraphApi.FormEdge[];
  nodes: AgentGraphApi.FormNode[];
  positions?: Record<string, { x: number; y: number }>;
  readonly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'selectNode', node: AgentGraphApi.FormNode): void;
  (e: 'selectEdge', edge: AgentGraphApi.FormEdge): void;
  (
    e: 'updatePositions',
    positions: Record<string, { x: number; y: number }>,
  ): void;
  (e: 'connect', edge: AgentGraphApi.FormEdge): void;
  (e: 'addNode'): void;
}>();

const flowNodes = ref<any[]>([]);
const flowEdges = ref<any[]>([]);
const connectionMode = ref<'conditional' | 'normal'>('normal');

function syncGraph() {
  flowNodes.value = props.nodes.map((node, index) => ({
    id: node.id,
    type: 'default',
    label: node.nodeName || node.id,
    position: props.positions?.[node.id] || {
      x: 80 + (index % 4) * 230,
      y: 60 + Math.floor(index / 4) * 150,
    },
    class:
      node.enabled === false ? 'agent-flow-node-disabled' : 'agent-flow-node',
    data: node,
  }));
  flowEdges.value = props.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label:
      edge.edgeType === 'conditional'
        ? edge.isDefault
          ? '默认'
          : edge.conditionMapping || edge.conditionType || '条件'
        : undefined,
    markerEnd: MarkerType.ArrowClosed,
    animated: edge.edgeType === 'conditional',
    data: edge,
  }));
}

watch(() => [props.nodes, props.edges], syncGraph, {
  deep: true,
  immediate: true,
});

function handleNodeClick({ node }: { node: Node }) {
  const value = props.nodes.find((item) => item.id === node.id);
  if (value) emit('selectNode', value);
}

function handleEdgeClick({ edge }: { edge: Edge }) {
  const value = props.edges.find((item) => item.id === edge.id);
  if (value) emit('selectEdge', value);
}

function handleDragStop() {
  const positions: Record<string, { x: number; y: number }> = {};
  for (const node of flowNodes.value) positions[node.id] = { ...node.position };
  emit('updatePositions', positions);
}

function handleConnect(connection: Connection) {
  if (props.readonly || !connection.source || !connection.target) return;
  const edge: AgentGraphApi.FormEdge = {
    id: `${connection.source}->${connection.target}`,
    source: connection.source,
    target: connection.target,
    edgeType: connectionMode.value,
  };
  if (edge.edgeType === 'normal') {
    flowEdges.value = addEdge(
      { ...connection, id: edge.id, markerEnd: MarkerType.ArrowClosed },
      flowEdges.value,
    ) as Edge[];
  }
  emit('connect', edge);
}
</script>

<template>
  <div class="agent-flow-canvas relative h-full min-h-[480px] w-full">
    <div
      v-if="!readonly"
      class="absolute left-3 top-3 z-10 rounded-lg border bg-white/95 p-2 shadow-sm"
    >
      <NSpace align="center" :size="6">
        <NButton size="small" type="primary" @click.stop="emit('addNode')">
          添加节点
        </NButton>
        <NButton
          size="small"
          :type="connectionMode === 'normal' ? 'info' : 'default'"
          @click.stop="connectionMode = 'normal'"
        >
          普通连线
        </NButton>
        <NButton
          size="small"
          :type="connectionMode === 'conditional' ? 'warning' : 'default'"
          @click.stop="connectionMode = 'conditional'"
        >
          条件连线
        </NButton>
      </NSpace>
      <div class="mt-1 text-[11px] text-gray-500">
        当前模式：{{ connectionMode === 'normal' ? '普通连线' : '条件连线' }}；点击节点或连线可编辑
      </div>
    </div>
    <VueFlow
      v-model:nodes="flowNodes"
      v-model:edges="flowEdges"
      :nodes-draggable="!readonly"
      :nodes-connectable="!readonly"
      :elements-selectable="true"
      fit-view-on-init
      @node-click="handleNodeClick"
      @edge-click="handleEdgeClick"
      @node-drag-stop="handleDragStop"
      @connect="handleConnect"
    >
      <Background pattern-color="#cbd5e1" :gap="20" />
      <MiniMap pannable zoomable />
      <Controls />
    </VueFlow>
  </div>
</template>

<style scoped>
.agent-flow-canvas :deep(.vue-flow__node) {
  border: 1px solid #94a3b8;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  box-shadow: 0 2px 8px rgb(15 23 42 / 8%);
}

.agent-flow-canvas :deep(.agent-flow-node-disabled) {
  opacity: 0.55;
  filter: grayscale(0.6);
}
</style>

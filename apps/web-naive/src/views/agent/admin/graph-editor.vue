<script lang="ts" setup>
import type { AgentGraphApi } from '#/api/agent/graph';
import type { NodeTypeApi } from '#/api/agent/node-type';

import { nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import {
  Handle,
  Position,
  useVueFlow,
  VueFlow,
} from '@vue-flow/core';
import type { Connection, Edge, Node } from '@vue-flow/core';
import { Page } from '@vben/common-ui';
import { NButton, NModal, NSpace, NSpin, NTag } from 'naive-ui';

import {
  getGraphConfig,
  updateGraphConfig,
  validateGraphConfig,
} from '#/api/agent/graph';
import { getNodeTypes } from '#/api/agent/node-type';

import NodeForm from './modules/node-form.vue';
import ValidateResult from './modules/validate-result.vue';

const route = useRoute();
const router = useRouter();

const agentId = ref((route.query.agentId as string) || '');
const versionId = ref(Number(route.query.versionId) || 0);
const agentName = ref((route.query.agentName as string) || '');

watch(
  () => route.query,
  (q) => {
    agentId.value = (q.agentId as string) || '';
    versionId.value = Number(q.versionId) || 0;
    agentName.value = (q.agentName as string) || '';
    loadGraph();
    loadNodeTypes();
  },
);

const loading = ref(false);
const saving = ref(false);
const nodeTypesMeta = ref<NodeTypeApi.NodeTypeMetaVO[]>([]);
const selectedNode = ref<Node | null>(null);
const selectedEdge = ref<Edge | null>(null);
const showNodeForm = ref(false);
const showValidateResult = ref(false);
const validationResult = ref<AgentGraphApi.GraphValidationVO>({
  errors: [],
  valid: false,
  warnings: [],
});

const { nodes, edges, addNodes, addEdges, removeNodes, removeEdges, fitView } =
  useVueFlow();

function onBack() {
  router.push({
    path: '/agent/admin/version',
    query: { agentId: agentId.value, agentName: agentName.value },
  });
}

async function loadGraph() {
  if (!agentId.value || !versionId.value) return;
  loading.value = true;
  try {
    const detail = await getGraphConfig(agentId.value, versionId.value);
    if (!detail?.graphConfig) return;
    const config = detail.graphConfig;

    const graphNodes: Node[] = [];
    const graphEdges: Edge[] = [];

    if (config.nodes) {
      for (const [key, nodeData] of Object.entries(config.nodes)) {
        const nd = nodeData as any;
        graphNodes.push({
          id: key,
          type: 'custom',
          position: { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 },
          data: {
            nodeId: key,
            nodeName: nd.nodeName || key,
            nodeType: nd.nodeType || '',
            enabled: nd.enabled !== false,
            description: nd.description || '',
            config: nd.config || {},
          },
        });
      }
    }

    if (config.edges) {
      for (const [source, targets] of Object.entries(config.edges)) {
        for (const target of targets as string[]) {
          graphEdges.push({
            id: `${source}->${target}`,
            source,
            target,
            type: 'default',
            animated: false,
          });
        }
      }
    }

    if (config.conditionalEdges) {
      for (const [source, cInfo] of Object.entries(config.conditionalEdges)) {
        const ci = cInfo as any;
        const defaultTarget = ci.defaultTarget;
        const nodeMappings = ci.nodeMappings || {};
        if (defaultTarget) {
          graphEdges.push({
            id: `${source}->${defaultTarget}__cond_default`,
            source,
            target: defaultTarget,
            type: 'default',
            animated: true,
            style: { strokeDasharray: '5 5' },
            data: { conditionType: ci.conditionType, isConditional: true },
          });
        }
        for (const [mapping, targetTile] of Object.entries(nodeMappings)) {
          const target = targetTile as string;
          graphEdges.push({
            id: `${source}->${target}__cond_${mapping}`,
            source,
            target,
            type: 'default',
            animated: true,
            style: { strokeDasharray: '5 5' },
            label: mapping,
            data: { conditionType: ci.conditionType, isConditional: true },
          });
        }
      }
    }

    nodes.value = graphNodes;
    edges.value = graphEdges;
    await nextTick();
    fitView();
  } catch {
    // ignore load errors for new/empty versions
  } finally {
    loading.value = false;
  }
}

function buildGraphConfig(): AgentGraphApi.GraphConfigRequest {
  const nMap: Record<string, any> = {};
  for (const n of nodes.value) {
    nMap[n.id] = {
      nodeName: n.data?.nodeName || n.id,
      description: n.data?.description || '',
      nodeType: n.data?.nodeType || '',
      enabled: n.data?.enabled !== false,
      config: n.data?.config || {},
    };
  }

  const eMap: Record<string, string[]> = {};
  const ceMap: Record<string, any> = {};

  for (const e of edges.value) {
    if (e.data?.isConditional) {
      if (!ceMap[e.source]) {
        ceMap[e.source] = {
          conditionType: e.data?.conditionType || '',
          defaultTarget: '',
          nodeMappings: {},
        };
      }
      if (e.id?.includes('__cond_default')) {
        ceMap[e.source].defaultTarget = e.target;
      } else if (e.label) {
        ceMap[e.source].nodeMappings[e.label as string] = e.target;
      }
    } else {
      if (!eMap[e.source]) eMap[e.source] = [];
      eMap[e.source].push(e.target);
    }
  }

  return {
    name: agentName.value,
    nodes: nMap,
    edges: eMap,
    conditionalEdges: ceMap,
    startNode: nodes.value[0]?.id || '',
    endNode: nodes.value[nodes.value.length - 1]?.id || '',
  };
}

async function handleSave() {
  saving.value = true;
  try {
    await updateGraphConfig(agentId.value, versionId.value, buildGraphConfig());
  } catch {
    // error handled by interceptor
  } finally {
    saving.value = false;
  }
}

async function handleValidate() {
  try {
    const result = await validateGraphConfig(
      agentId.value,
      versionId.value,
      buildGraphConfig(),
    );
    validationResult.value = result;
    showValidateResult.value = true;
  } catch {
    // error handled by interceptor
  }
}

function onNodeClick({ node }: { node: Node }) {
  selectedNode.value = node;
  selectedEdge.value = null;
  showNodeForm.value = true;
}

function onEdgeClick({ edge }: { edge: Edge }) {
  selectedEdge.value = edge;
  selectedNode.value = null;
  showNodeForm.value = false;
}

function onPaneClick() {
  selectedNode.value = null;
  selectedEdge.value = null;
  showNodeForm.value = false;
}

function onConnect(connection: Connection) {
  const id = `${connection.source}->${connection.target}`;
  addEdges([
    {
      id,
      source: connection.source,
      target: connection.target,
      type: 'default',
    },
  ]);
}

function handleAddNode(nodeType: NodeTypeApi.NodeTypeMetaVO) {
  const nodeId = `${nodeType.code.toLowerCase()}_${Date.now()}`;
  addNodes([
    {
      id: nodeId,
      type: 'custom',
      position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
      data: {
        nodeId,
        nodeName: nodeType.name,
        nodeType: nodeType.code,
        enabled: true,
        description: nodeType.description,
        config: {},
      },
    },
  ]);
}

function handleDeleteSelected() {
  if (selectedNode.value) {
    removeNodes([selectedNode.value.id]);
    showNodeForm.value = false;
    selectedNode.value = null;
  } else if (selectedEdge.value) {
    removeEdges([selectedEdge.value.id]);
    selectedEdge.value = null;
  }
}

function onNodeUpdate() {
  showNodeForm.value = false;
}

async function loadNodeTypes() {
  try {
    nodeTypesMeta.value = (await getNodeTypes()) || [];
  } catch {
    // ignore, node type list may be unavailable
  }
}

onMounted(() => {
  loadNodeTypes();
  loadGraph();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-2">
      <NSpace align="center">
        <NButton @click="onBack">返回</NButton>
        <span class="text-lg font-semibold">{{ agentName }} - Graph 编排</span>
        <div class="flex-1" />
        <NButton @click="handleValidate">校验</NButton>
        <NButton :loading="saving" type="primary" @click="handleSave">
          保存
        </NButton>
      </NSpace>
      <div class="flex flex-1 gap-2 overflow-hidden">
        <div class="w-[200px] flex-shrink-0 overflow-y-auto border-r p-2">
          <div class="mb-2 text-sm font-bold">节点类型</div>
          <div
            v-for="nt in nodeTypesMeta"
            :key="nt.code"
            class="mb-1 cursor-pointer rounded border p-2 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
            @click="handleAddNode(nt)"
          >
            <div class="flex items-center gap-1">
              <span
                class="inline-block h-3 w-3 rounded-full"
                :style="{ backgroundColor: nt.color || '#666' }"
              />
              <span class="font-medium">{{ nt.name }}</span>
            </div>
            <div class="mt-1 text-gray-500">{{ nt.code }}</div>
          </div>
        </div>

        <div class="flex flex-1 flex-col">
          <NSpin :show="loading">
            <VueFlow
              :nodes="nodes"
              :edges="edges"
              class="h-full w-full"
              :default-viewport="{ x: 0, y: 0, zoom: 1 }"
              fit-view-on-init
              @connect="onConnect"
              @node-click="onNodeClick"
              @edge-click="onEdgeClick"
              @pane-click="onPaneClick"
            >
              <template #node-custom="nodeProps">
                <div
                  class="rounded-lg border-2 bg-white px-3 py-2 shadow-md dark:bg-gray-800"
                  :class="[
                    nodeProps.selected
                      ? 'border-blue-500'
                      : 'border-gray-300 dark:border-gray-600',
                    nodeProps.data?.enabled !== false ? '' : 'opacity-50',
                  ]"
                  :style="{
                    minWidth: '150px',
                    borderLeftColor: nodeTypesMeta.find(
                      (nt) => nt.code === nodeProps.data?.nodeType,
                    )?.color || '#666',
                    borderLeftWidth: '4px',
                  }"
                >
                  <Handle type="target" :position="Position.Top" />
                  <div class="text-sm font-bold">
                    {{ nodeProps.data?.nodeName || nodeProps.id }}
                  </div>
                  <div class="flex items-center gap-1">
                    <NTag :bordered="false" size="small">
                      {{ nodeProps.data?.nodeType || 'default' }}
                    </NTag>
                  </div>
                  <Handle type="source" :position="Position.Bottom" />
                </div>
              </template>
              <Background />
              <Controls />
            </VueFlow>
          </NSpin>

          <div class="flex items-center gap-2 border-t p-2">
            <span class="text-xs text-gray-500">
              节点: {{ nodes.length }} | 连线: {{ edges.length }}
            </span>
            <div class="flex-1" />
            <NButton
              v-if="selectedNode || selectedEdge"
              size="small"
              type="error"
              @click="handleDeleteSelected"
            >
              删除选中
            </NButton>
          </div>
        </div>

        <NodeForm
          v-if="showNodeForm && selectedNode"
          :node-type-meta="nodeTypesMeta"
          :selected-node="selectedNode"
          class="w-[300px] flex-shrink-0 overflow-y-auto border-l p-3"
          @close="showNodeForm = false"
          @update="onNodeUpdate"
        />
      </div>
    </div>

    <NModal
      v-model:show="showValidateResult"
      preset="card"
      title="校验结果"
      class="w-[480px]"
    >
      <ValidateResult :result="validationResult" />
    </NModal>
  </Page>
</template>

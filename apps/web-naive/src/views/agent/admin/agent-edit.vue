<script lang="ts" setup>
import type { Connection, Edge, Node } from '@vue-flow/core';

import type { AgentGraphApi } from '#/api/agent/graph';
import type { NodeTypeApi } from '#/api/agent/node-type';

import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { Handle, Position, useVueFlow, VueFlow } from '@vue-flow/core';
import {
  NButton,
  NCollapse,
  NCollapseItem,
  NDivider,
  NEmpty,
  NForm,
  NFormItemGi,
  NGi,
  NGrid,
  NInput,
  NInputNumber,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  activateVersion,
  archiveVersion,
  createVersion,
  deleteVersion,
  getVersionDetail,
  getVersionList,
  publishVersion,
} from '#/api/agent/version';
import { getAgentById, updateAgent } from '#/api/agent/admin';
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

// Agent info
const agentId = ref('');
const agentName = ref('');
const agentDescription = ref('');
const agentStatus = ref('1');
const agentDetailId = ref(0);
const loadingAgent = ref(false);

// Version management
const versions = ref<Array<{ label: string; value: number }>>([]);
const versionMap = ref<Record<number, { versionNumber: string; status: string; description: string }>>({});
const selectedVersionId = ref<number | null>(null);
const loadingVersions = ref(false);
const showCreateVersion = ref(false);
const newVersionNumber = ref('');
const newVersionDesc = ref('');

// Graph editor
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

const selectedVersionInfo = computed(() => {
  if (!selectedVersionId.value) return null;
  return versionMap.value[selectedVersionId.value] || null;
});

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '停用', value: '0' },
];

// --------------- Lifecycle ---------------

onMounted(async () => {
  const id = route.query.id as string;
  if (id) {
    agentDetailId.value = Number(id);
    await loadAgentDetail(Number(id));
  }
});

async function loadAgentDetail(id: number) {
  loadingAgent.value = true;
  try {
    const detail = await getAgentById(id);
    if (!detail) return;
    agentId.value = detail.agentId;
    agentName.value = detail.name;
    agentDescription.value = detail.description || '';
    agentStatus.value = detail.status || '1';
    await loadVersions();
  } catch (e) {
    console.error('Failed to load agent detail', e);
  } finally {
    loadingAgent.value = false;
  }
}

async function loadVersions() {
  if (!agentId.value) return;
  loadingVersions.value = true;
  try {
    const list = (await getVersionList(agentId.value)) || [];
    versionMap.value = {};
    versions.value = list.map((v) => {
      versionMap.value[v.id] = {
        versionNumber: v.versionNumber,
        status: v.status,
        description: v.description,
      };
      return { label: `${v.versionNumber} (${statusLabel(v.status)})`, value: v.id };
    });
    // Auto-select the first published version, or latest
    const published = list.find((v) => v.status === 'PUBLISHED');
    if (published) {
      selectedVersionId.value = published.id;
    } else if (list.length > 0) {
      selectedVersionId.value = list[list.length - 1].id;
    }
  } catch (e) {
    console.error('Failed to load versions', e);
  } finally {
    loadingVersions.value = false;
  }
}

function statusLabel(s: string): string {
  const map: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档' };
  return map[s] || s;
}

// --------------- Version switch ---------------

watch(selectedVersionId, async (newId) => {
  if (newId) {
    await loadGraph();
  } else {
    nodes.value = [];
    edges.value = [];
  }
});

// --------------- Save agent info ---------------

async function handleSaveAgent() {
  if (!agentDetailId.value) return;
  try {
    await updateAgent(agentDetailId.value, {
      agentId: agentId.value,
      name: agentName.value,
      description: agentDescription.value,
      status: agentStatus.value,
    });
    message.success('Agent信息保存成功');
  } catch {
    message.error('保存Agent信息失败');
  }
}

// --------------- Graph editor ---------------

async function loadGraph() {
  if (!agentId.value || !selectedVersionId.value) return;
  loading.value = true;
  try {
    const detail = await getGraphConfig(agentId.value, selectedVersionId.value);
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
          position: {
            x: 100 + Math.random() * 300,
            y: 100 + Math.random() * 300,
          },
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

async function handleSaveGraph() {
  if (!agentId.value || !selectedVersionId.value) return;
  saving.value = true;
  try {
    await updateGraphConfig(agentId.value, selectedVersionId.value, buildGraphConfig());
    message.success('Graph 保存成功');
  } catch {
    message.error('保存 Graph 失败');
  } finally {
    saving.value = false;
  }
}

async function handleValidate() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    const result = await validateGraphConfig(
      agentId.value,
      selectedVersionId.value,
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
    // ignore
  }
}

// --------------- Version operations ---------------

async function handleCreateVersion() {
  if (!agentId.value || !newVersionNumber.value) return;
  try {
    await createVersion(agentId.value, {
      versionNumber: newVersionNumber.value,
      description: newVersionDesc.value,
    });
    message.success('版本创建成功');
    showCreateVersion.value = false;
    newVersionNumber.value = '';
    newVersionDesc.value = '';
    await loadVersions();
  } catch {
    message.error('创建版本失败');
  }
}

async function handlePublish() {
  if (!agentId.value || !selectedVersionId.value) return;
  const info = selectedVersionInfo.value;
  if (info && info.status === 'PUBLISHED') {
    message.warning('该版本已发布');
    return;
  }
  try {
    await publishVersion(agentId.value, selectedVersionId.value);
    message.success('版本已发布');
    await loadVersions();
  } catch {
    message.error('发布失败');
  }
}

async function handleActivate() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    await activateVersion(agentId.value, selectedVersionId.value);
    message.success('版本已激活');
  } catch {
    message.error('激活失败');
  }
}

async function handleArchive() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    await archiveVersion(agentId.value, selectedVersionId.value);
    message.success('版本已归档');
    await loadVersions();
  } catch {
    message.error('归档失败');
  }
}

async function handleDeleteVersion() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    await deleteVersion(agentId.value, selectedVersionId.value);
    message.success('版本已删除');
    selectedVersionId.value = null;
    await loadVersions();
  } catch {
    message.error('删除失败');
  }
}

function onBack() {
  router.push({ path: '/agent/admin/list' });
}

onMounted(() => {
  loadNodeTypes();
});
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3 p-4">
      <!-- Top bar -->
      <NSpace align="center">
        <NButton @click="onBack">← 返回列表</NButton>
        <span class="text-lg font-semibold">{{ agentName || '加载中...' }}</span>
        <div class="flex-1"></div>
      </NSpace>

      <NSpin :show="loadingAgent">
        <div class="flex flex-1 gap-4 overflow-hidden">
          <!-- Left: Agent Info + Version Control -->
          <div class="w-[380px] flex-shrink-0 overflow-y-auto space-y-3">
            <!-- Agent Info Section -->
            <NCollapse :default-expanded-names="['info']">
              <NCollapseItem name="info" title="基本信息">
                <NForm label-placement="top" label-width="auto">
                  <NGrid :cols="1" :x-gap="12">
                    <NGi>
                      <NFormItemGi label="Agent 标识">
                        <NInput v-model:value="agentId" disabled placeholder="Agent 唯一标识" />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi label="名称">
                        <NInput v-model:value="agentName" placeholder="Agent 名称" />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi label="描述">
                        <NInput
                          v-model:value="agentDescription"
                          :maxlength="500"
                          :rows="2"
                          placeholder="描述"
                          type="textarea"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi label="状态">
                        <NSelect v-model:value="agentStatus" :options="statusOptions" />
                      </NFormItemGi>
                    </NGi>
                  </NGrid>
                  <div class="mt-2">
                    <NButton type="primary" @click="handleSaveAgent">保存信息</NButton>
                  </div>
                </NForm>
              </NCollapseItem>
            </NCollapse>

            <!-- Version Control Section -->
            <NCollapse :default-expanded-names="['version']">
              <NCollapseItem name="version" title="版本管理">
                <div class="space-y-3">
                  <NSpace vertical>
                    <label class="text-sm font-medium">选择版本</label>
                    <NSpace>
                      <NSelect
                        v-model:value="selectedVersionId"
                        :disabled="versions.length === 0"
                        :loading="loadingVersions"
                        :options="versions"
                        class="flex-1"
                        placeholder="选择版本"
                      />
                      <NButton size="small" @click="showCreateVersion = !showCreateVersion">
                        新建
                      </NButton>
                    </NSpace>
                  </NSpace>

                  <!-- Quick create version -->
                  <div v-if="showCreateVersion" class="rounded border p-2">
                    <NSpace vertical>
                      <NInput
                        v-model:value="newVersionNumber"
                        placeholder="版本号（如 v2.0.0）"
                        size="small"
                      />
                      <NInput
                        v-model:value="newVersionDesc"
                        :maxlength="500"
                        :rows="1"
                        placeholder="版本描述（可选）"
                        size="small"
                        type="textarea"
                      />
                      <NButton size="small" type="primary" @click="handleCreateVersion">
                        确定创建
                      </NButton>
                    </NSpace>
                  </div>

                  <!-- Version info -->
                  <div v-if="selectedVersionInfo" class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-800">
                    <div>版本号: {{ selectedVersionInfo.versionNumber }}</div>
                    <div>状态: <NTag :bordered="false" size="small">{{ statusLabel(selectedVersionInfo.status) }}</NTag></div>
                    <div v-if="selectedVersionInfo.description" class="mt-1">
                      描述: {{ selectedVersionInfo.description }}
                    </div>
                  </div>

                  <!-- Version actions -->
                  <div v-if="selectedVersionId" class="flex flex-wrap gap-2">
                    <NButton
                      v-if="selectedVersionInfo?.status !== 'PUBLISHED'"
                      size="small"
                      type="primary"
                      @click="handlePublish"
                    >
                      发布
                    </NButton>
                    <NButton
                      v-if="selectedVersionInfo?.status === 'PUBLISHED'"
                      size="small"
                      type="success"
                      @click="handleActivate"
                    >
                      激活
                    </NButton>
                    <NButton
                      v-if="selectedVersionInfo?.status === 'PUBLISHED'"
                      size="small"
                      @click="handleArchive"
                    >
                      归档
                    </NButton>
                    <NPopconfirm @positive-click="handleDeleteVersion">
                      <template #trigger>
                        <NButton size="small" type="error">删除</NButton>
                      </template>
                      确认删除该版本？
                    </NPopconfirm>
                  </div>
                </div>
              </NCollapseItem>
            </NCollapse>
          </div>

          <!-- Right: Graph Editor -->
          <div class="flex flex-1 flex-col overflow-hidden rounded border">
            <!-- Graph editor toolbar -->
            <NSpace align="center" class="border-b p-2">
              <span class="text-sm font-medium">
                Graph 编排 —
                <span v-if="selectedVersionInfo">
                  版本 {{ selectedVersionInfo.versionNumber }}
                </span>
                <span v-else class="text-gray-400">请选择版本</span>
              </span>
              <div class="flex-1"></div>
              <NButton
                :disabled="!selectedVersionId"
                size="small"
                @click="handleValidate"
              >
                校验
              </NButton>
              <NButton
                :disabled="!selectedVersionId"
                :loading="saving"
                size="small"
                type="primary"
                @click="handleSaveGraph"
              >
                保存 Graph
              </NButton>
            </NSpace>

            <!-- Canvas area -->
            <div class="flex flex-1 overflow-hidden">
              <!-- Node type palette -->
              <div class="w-[180px] flex-shrink-0 overflow-y-auto border-r p-2">
                <div class="mb-2 text-xs font-bold">节点类型</div>
                <div
                  v-for="nt in nodeTypesMeta"
                  :key="nt.code"
                  class="mb-1 cursor-pointer rounded border p-1.5 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  @click="selectedVersionId && handleAddNode(nt)"
                >
                  <div class="flex items-center gap-1">
                    <span
                      class="inline-block h-2.5 w-2.5 rounded-full"
                      :style="{ backgroundColor: nt.color || '#666' }"
                    ></span>
                    <span class="font-medium">{{ nt.name }}</span>
                  </div>
                  <div class="mt-0.5 text-gray-400">{{ nt.code }}</div>
                </div>
              </div>

              <!-- VueFlow canvas -->
              <div class="relative flex-1">
                <div v-if="!selectedVersionId" class="flex h-full items-center justify-center">
                  <NEmpty description="请选择一个版本以编辑 Graph" />
                </div>
                <NSpin v-else :show="loading">
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
                          minWidth: '140px',
                          borderLeftColor:
                            nodeTypesMeta.find(
                              (nt) => nt.code === nodeProps.data?.nodeType,
                            )?.color || '#666',
                          borderLeftWidth: '4px',
                        }"
                      >
                        <Handle type="target" :position="Position.Top" />
                        <div class="text-xs font-bold">
                          {{ nodeProps.data?.nodeName || nodeProps.id }}
                        </div>
                        <div class="flex items-center gap-1">
                          <NTag :bordered="false" size="tiny">
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

                <!-- Bottom status bar -->
                <div class="absolute bottom-0 left-0 right-0 flex items-center gap-2 border-t bg-white p-1.5 dark:bg-gray-900">
                  <span class="text-xs text-gray-500">
                    节点: {{ nodes.length }} | 连线: {{ edges.length }}
                  </span>
                  <div class="flex-1"></div>
                  <NButton
                    v-if="selectedNode || selectedEdge"
                    size="tiny"
                    type="error"
                    @click="handleDeleteSelected"
                  >
                    删除选中
                  </NButton>
                </div>
              </div>

              <!-- Node property panel -->
              <NodeForm
                v-if="showNodeForm && selectedNode"
                :node-type-meta="nodeTypesMeta"
                :selected-node="selectedNode"
                class="w-[280px] flex-shrink-0 overflow-y-auto border-l p-2"
                @close="showNodeForm = false"
                @update="onNodeUpdate"
              />
            </div>
          </div>
        </div>
      </NSpin>
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

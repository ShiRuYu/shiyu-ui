<script lang="ts" setup>
import type { AgentGraphApi } from '#/api/agent/graph';
import type { NodeTypeApi } from '#/api/agent/node-type';

import { computed, h, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NEmpty,
  NForm,
  NFormItem,
  NFormItemGi,
  NGi,
  NGrid,
  NInput,
  NModal,
  NPopconfirm,
  NSelect,
  NSpace,
  NSpin,
  NTag,
} from 'naive-ui';

import { requestClient } from '#/api/request';
import { message } from '#/adapter/naive';
import {
  activateVersion,
  archiveVersion,
  createVersion,
  deleteVersion,
  getVersionList,
  publishVersion,
} from '#/api/agent/version';
import {
  createAgent,
  getAgentById,
  getAgentListAll,
  updateAgent,
} from '#/api/agent/admin';
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

// Mode: read-only vs edit
const readonly = ref(route.query.readonly === 'true');
const isNew = ref(route.query.new === 'true');

// Agent selector (for direct entry without id)
const agentOptions = ref<Array<{ label: string; value: number }>>([]);
const selectedAgentId = ref<number | null>(null);
const loadingOptions = ref(false);

// Agent info
const agentId = ref('');
const agentName = ref('');
const agentDescription = ref('');
const agentStatus = ref('1');
const agentDetailId = ref(0);
const loadingAgent = ref(false);

// Version management
const versions = ref<Array<{ label: string; value: number }>>([]);
const versionMap = ref<
  Record<number, { versionNumber: string; status: string; description: string }>
>({});
const selectedVersionId = ref<number | null>(null);
const loadingVersions = ref(false);
const showCreateVersion = ref(false);
const newVersionNumber = ref('');
const newVersionDesc = ref('');

// Graph form
const loading = ref(false);
const saving = ref(false);
const nodeTypesMeta = ref<NodeTypeApi.NodeTypeMetaVO[]>([]);

const formNodes = ref<AgentGraphApi.FormNode[]>([]);
const formEdges = ref<AgentGraphApi.FormEdge[]>([]);

const startNode = ref('');
const endNode = ref('');

const showValidateResult = ref(false);
const validationResult = ref<AgentGraphApi.GraphValidationVO>({
  errors: [],
  valid: false,
  warnings: [],
});

// Node modal state
const showNodeModal = ref(false);
const editingNode = ref<AgentGraphApi.FormNode>({
  id: '',
  nodeName: '',
  nodeType: '',
  enabled: true,
  description: '',
  config: {},
});
const isNewNode = ref(false);

// Normal edge modal state
const showEdgeModal = ref(false);
const edgeSource = ref('');
const edgeTarget = ref('');
const isNewEdge = ref(false);

// Conditional edge modal state
const showCondEdgeModal = ref(false);
const condEdgeSource = ref('');
const condEdgeTarget = ref('');
const condEdgeType = ref('');
const condEdgeMapping = ref('');
const condEdgeIsDefault = ref(false);
const isNewCondEdge = ref(false);
const condEdgeIntentOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadCondEdgeIntentOptions() {
  try {
    const res: any = await requestClient.get('/dict/type/INTENT_CODE');
    const data = Array.isArray(res) ? res : res?.data ?? [];
    condEdgeIntentOptions.value = data.map((item: any) => ({
      label: item.dictLabel,
      value: item.dictValue,
    }));
  } catch {
    condEdgeIntentOptions.value = [];
  }
}

const selectedVersionInfo = computed(() => {
  if (!selectedVersionId.value) return null;
  return versionMap.value[selectedVersionId.value] || null;
});

const statusOptions = [
  { label: '启用', value: '1' },
  { label: '停用', value: '0' },
];

const nodeOptions = computed(() =>
  formNodes.value.map((n) => ({
    label: `${n.nodeName} (${n.id})`,
    value: n.id,
  })),
);

const normalEdges = computed(() =>
  formEdges.value.filter((e) => e.edgeType === 'normal'),
);

const conditionalEdges = computed(() =>
  formEdges.value.filter((e) => e.edgeType === 'conditional'),
);

// --------------- Table columns ---------------

const nodeColumns = computed(() => [
  { title: '名称', key: 'nodeName', width: 130 },
  { title: '类型', key: 'nodeType', width: 100 },
  {
    title: '状态',
    key: 'enabled',
    width: 70,
    render: (row: AgentGraphApi.FormNode) => (row.enabled ? '启用' : '停用'),
  },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  {
    title: '操作',
    key: 'actions',
    width: 110,
    fixed: 'right' as const,
    render: (row: AgentGraphApi.FormNode) =>
      h(NSpace, {}, [
        h(NButton, { size: 'tiny', onClick: () => openEditNode(row) }, '编辑'),
        h(
          NButton,
          {
            size: 'tiny',
            type: 'error',
            onClick: () => handleDeleteNode(row.id),
          },
          '删除',
        ),
      ]),
  },
]);

const normalEdgeColumns = [
  { title: '源节点', key: 'source', width: 130 },
  { title: '目标节点', key: 'target', width: 130 },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row: AgentGraphApi.FormEdge) =>
      h(
        NButton,
        {
          size: 'tiny',
          type: 'error',
          onClick: () => handleDeleteEdge(row.id),
        },
        '删除',
      ),
  },
];

const conditionalEdgeColumns = [
  { title: '源节点', key: 'source', width: 120 },
  { title: '目标节点', key: 'target', width: 120 },
  { title: '条件类型', key: 'conditionType', width: 90 },
  { title: '映射值', key: 'conditionMapping', width: 90 },
  {
    title: '默认目标',
    key: 'isDefault',
    width: 80,
    render: (row: AgentGraphApi.FormEdge) => (row.isDefault ? '是' : '否'),
  },
  {
    title: '操作',
    key: 'actions',
    width: 80,
    render: (row: AgentGraphApi.FormEdge) =>
      h(
        NButton,
        {
          size: 'tiny',
          type: 'error',
          onClick: () => handleDeleteEdge(row.id),
        },
        '删除',
      ),
  },
];

// --------------- Lifecycle ---------------

onMounted(async () => {
  const id = route.query.id as string;
  const isNewMode = route.query.new === 'true';
  if (id) {
    agentDetailId.value = Number(id);
    await loadAgentDetail(Number(id));
  } else if (!isNewMode) {
    await loadAgentOptions();
  }
  await loadNodeTypes();
});

async function loadAgentOptions() {
  loadingOptions.value = true;
  try {
    const opts = (await getAgentListAll()) || [];
    agentOptions.value = opts.map((o: any) => ({ label: o.name, value: o.id }));
  } catch {
    // ignore
  } finally {
    loadingOptions.value = false;
  }
}

watch(selectedAgentId, async (newId) => {
  if (newId) {
    agentDetailId.value = newId;
    await loadAgentDetail(newId);
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
      return {
        label: `${v.versionNumber} (${statusLabel(v.status)})`,
        value: v.id,
      };
    });
    const published = list.find((v) => v.status === 'PUBLISHED');
    if (published) {
      selectedVersionId.value = published.id;
    } else if (list.length > 0) {
      selectedVersionId.value = list[list.length - 1]!.id;
    }
  } catch (e) {
    console.error('Failed to load versions', e);
  } finally {
    loadingVersions.value = false;
  }
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档',
  };
  return map[s] || s;
}

// --------------- Version switch ---------------

watch(selectedVersionId, async (newId) => {
  if (newId) {
    await loadGraph();
  } else {
    formNodes.value = [];
    formEdges.value = [];
  }
});

// --------------- New agent ---------------

async function handleCreateNewAgent() {
  if (!agentId.value || !agentName.value) {
    message.error('请填写 Agent 标识和名称');
    return;
  }
  try {
    const vo = await createAgent({
      agentId: agentId.value,
      name: agentName.value,
      description: agentDescription.value,
      status: agentStatus.value,
    });
    message.success('Agent 创建成功');
    agentDetailId.value = vo.id;
  } catch {
    message.error('创建 Agent 失败');
  }
}

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

// --------------- Graph form ---------------

async function loadGraph() {
  if (!agentId.value || !selectedVersionId.value) return;
  loading.value = true;
  try {
    const detail = await getGraphConfig(agentId.value, selectedVersionId.value);
    if (!detail?.graphConfig) return;
    const config = detail.graphConfig;

    const nodes: AgentGraphApi.FormNode[] = [];
    const edges: AgentGraphApi.FormEdge[] = [];

    if (config.nodes) {
      for (const [key, nodeData] of Object.entries(config.nodes)) {
        const nd = nodeData as any;
        nodes.push({
          id: key,
          nodeName: nd.nodeName || key,
          nodeType: nd.nodeType || '',
          enabled: nd.enabled !== false,
          description: nd.description || '',
          config: nd.config || {},
        });
      }
    }

    if (config.edges) {
      for (const [source, targets] of Object.entries(config.edges)) {
        for (const target of targets as string[]) {
          edges.push({
            id: `${source}->${target}`,
            source,
            target,
            edgeType: 'normal',
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
          edges.push({
            id: `${source}->${defaultTarget}__cond_default`,
            source,
            target: defaultTarget,
            edgeType: 'conditional',
            conditionType: ci.conditionType,
            isDefault: true,
          });
        }
        for (const [mapping, targetTile] of Object.entries(nodeMappings)) {
          const target = targetTile as string;
          edges.push({
            id: `${source}->${target}__cond_${mapping}`,
            source,
            target,
            edgeType: 'conditional',
            conditionType: ci.conditionType,
            conditionMapping: mapping,
            isDefault: false,
          });
        }
      }
    }

    formNodes.value = nodes;
    formEdges.value = edges;
    startNode.value = config.startNode || '';
    endNode.value = config.endNode || '';
  } catch {
    // ignore load errors for new/empty versions
  } finally {
    loading.value = false;
  }
}

function buildGraphConfig(): AgentGraphApi.GraphConfigRequest {
  const nMap: Record<string, any> = {};
  for (const n of formNodes.value) {
    nMap[n.id] = {
      nodeName: n.nodeName || n.id,
      description: n.description || '',
      nodeType: n.nodeType || '',
      enabled: n.enabled !== false,
      config: n.config || {},
    };
  }

  const eMap: Record<string, string[]> = {};
  const ceMap: Record<string, any> = {};

  for (const e of formEdges.value) {
    if (e.edgeType === 'conditional') {
      if (!ceMap[e.source]) {
        ceMap[e.source] = {
          conditionType: e.conditionType || '',
          defaultTarget: '',
          nodeMappings: {},
        };
      }
      if (e.isDefault) {
        ceMap[e.source].defaultTarget = e.target;
      } else if (e.conditionMapping) {
        ceMap[e.source].nodeMappings[e.conditionMapping] = e.target;
      }
    } else {
      if (!eMap[e.source]) eMap[e.source] = [];
      eMap[e.source]!.push(e.target);
    }
  }

  return {
    name: agentName.value,
    nodes: nMap,
    edges: eMap,
    conditionalEdges: ceMap,
    startNode: startNode.value || formNodes.value[0]?.id || '',
    endNode:
      endNode.value || formNodes.value[formNodes.value.length - 1]?.id || '',
  };
}

async function handleSaveGraph() {
  if (!agentId.value || !selectedVersionId.value) return;
  saving.value = true;
  try {
    await updateGraphConfig(
      agentId.value,
      selectedVersionId.value,
      buildGraphConfig(),
    );
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

// --------------- Node CRUD ---------------

function openAddNode() {
  const firstType = nodeTypesMeta.value[0];
  editingNode.value = {
    id: `node_${Date.now()}`,
    nodeName: firstType?.name || '',
    nodeType: firstType?.code || '',
    enabled: true,
    description: '',
    config: {},
  };
  isNewNode.value = true;
  showNodeModal.value = true;
}

function openEditNode(node: AgentGraphApi.FormNode) {
  editingNode.value = { ...node, config: { ...(node.config || {}) } };
  isNewNode.value = false;
  showNodeModal.value = true;
}

function confirmNode() {
  if (isNewNode.value) {
    formNodes.value.push({ ...editingNode.value });
  } else {
    const idx = formNodes.value.findIndex((n) => n.id === editingNode.value.id);
    if (idx >= 0) formNodes.value[idx] = { ...editingNode.value };
  }
  showNodeModal.value = false;
}

function handleDeleteNode(id: string) {
  formNodes.value = formNodes.value.filter((n) => n.id !== id);
  // Also remove related edges
  formEdges.value = formEdges.value.filter(
    (e) => e.source !== id && e.target !== id,
  );
}

// --------------- Normal Edge CRUD ---------------

function openAddEdge() {
  edgeSource.value = '';
  edgeTarget.value = '';
  isNewEdge.value = true;
  showEdgeModal.value = true;
}

function confirmEdge() {
  if (!edgeSource.value || !edgeTarget.value) {
    message.warning('请选择源节点和目标节点');
    return;
  }
  const id = `${edgeSource.value}->${edgeTarget.value}`;
  formEdges.value.push({
    id,
    source: edgeSource.value,
    target: edgeTarget.value,
    edgeType: 'normal',
  });
  showEdgeModal.value = false;
}

// --------------- Conditional Edge CRUD ---------------

function openAddConditionalEdge() {
  condEdgeSource.value = '';
  condEdgeTarget.value = '';
  condEdgeType.value = '';
  condEdgeMapping.value = '';
  condEdgeIsDefault.value = false;
  isNewCondEdge.value = true;
  showCondEdgeModal.value = true;
  loadCondEdgeIntentOptions();
}

function confirmCondEdge() {
  if (!condEdgeSource.value || !condEdgeTarget.value) {
    message.warning('请选择源节点和目标节点');
    return;
  }
  const suffix = condEdgeIsDefault.value
    ? 'cond_default'
    : `cond_${condEdgeMapping.value || 'unknown'}`;
  const id = `${condEdgeSource.value}->${condEdgeTarget.value}__${suffix}`;
  formEdges.value.push({
    id,
    source: condEdgeSource.value,
    target: condEdgeTarget.value,
    edgeType: 'conditional',
    conditionType: condEdgeType.value,
    conditionMapping: condEdgeIsDefault.value
      ? undefined
      : condEdgeMapping.value,
    isDefault: condEdgeIsDefault.value,
  });
  showCondEdgeModal.value = false;
}

// --------------- Edge delete ---------------

function handleDeleteEdge(id: string) {
  formEdges.value = formEdges.value.filter((e) => e.id !== id);
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

async function loadNodeTypes() {
  try {
    nodeTypesMeta.value = (await getNodeTypes()) || [];
  } catch {
    // ignore
  }
}

function onBack() {
  router.push({ path: '/agent/admin/list' });
}
</script>

<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3 p-4">
      <!-- Top bar -->
      <NSpace align="center">
        <NButton @click="onBack">← 返回列表</NButton>
        <span v-if="agentDetailId" class="text-lg font-semibold">{{
          agentName || '加载中...'
        }}</span>
        <span v-else-if="isNew" class="text-lg font-semibold">新增 Agent</span>
        <span v-else class="text-lg font-semibold">Agent 管理</span>
        <div class="flex-1" />
        <NTag
          v-if="readonly && agentDetailId"
          :bordered="false"
          type="info"
          size="small"
          >只读</NTag
        >
      </NSpace>

      <!-- Agent selector (direct entry without id) -->
      <div v-if="!agentDetailId && !isNew" class="flex items-center gap-2 p-4">
        <span class="text-sm font-medium whitespace-nowrap">选择 Agent：</span>
        <NSelect
          v-model:value="selectedAgentId"
          :loading="loadingOptions"
          :options="agentOptions"
          class="w-[320px]"
          placeholder="请选择一个 Agent"
          @update:value="(val: any) => (selectedAgentId = val)"
        />
      </div>

      <!-- New agent form (isNew mode) -->
      <div v-if="isNew" class="max-w-[480px] space-y-3">
        <NForm label-placement="top" label-width="auto">
          <NGrid :cols="1" :x-gap="12">
            <NGi>
              <NFormItemGi label="Agent 标识">
                <NInput
                  v-model:value="agentId"
                  placeholder="唯一标识（如 my-agent）"
                />
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
          <NButton type="primary" @click="handleCreateNewAgent"
            >创建 Agent</NButton
          >
        </NForm>
      </div>

      <NSpin v-if="agentDetailId" :show="loadingAgent">
        <div class="flex flex-1 gap-4 overflow-hidden">
          <!-- Left: Agent Info + Version Control -->
          <div class="w-[380px] flex-shrink-0 overflow-y-auto space-y-3">
            <!-- Agent Info Section -->
            <NCollapse :default-expanded-names="['info']">
              <NCollapseItem name="info">
                <template #header><span>基本信息</span></template>
                <NForm label-placement="top" label-width="auto">
                  <NGrid :cols="1" :x-gap="12">
                    <NGi>
                      <NFormItemGi label="Agent 标识">
                        <NInput
                          v-model:value="agentId"
                          :disabled="true"
                          placeholder="Agent 唯一标识"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi label="名称">
                        <NInput
                          v-model:value="agentName"
                          :disabled="readonly"
                          placeholder="Agent 名称"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi label="描述">
                        <NInput
                          v-model:value="agentDescription"
                          :disabled="readonly"
                          :maxlength="500"
                          :rows="2"
                          placeholder="描述"
                          type="textarea"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi label="状态">
                        <NSelect
                          v-model:value="agentStatus"
                          :disabled="readonly"
                          :options="statusOptions"
                        />
                      </NFormItemGi>
                    </NGi>
                  </NGrid>
                  <div v-if="!readonly" class="mt-2">
                    <NButton type="primary" @click="handleSaveAgent"
                      >保存信息</NButton
                    >
                  </div>
                </NForm>
              </NCollapseItem>
            </NCollapse>

            <!-- Version Control Section -->
            <NCollapse :default-expanded-names="['version']">
              <NCollapseItem name="version">
                <template #header><span>版本管理</span></template>
                <div class="space-y-3">
                  <NSpace vertical>
                    <label class="text-sm font-medium">选择版本</label>
                    <NSpace>
                      <NSelect
                        v-model:value="selectedVersionId"
                        :disabled="versions.length === 0 || readonly"
                        :loading="loadingVersions"
                        :options="versions"
                        class="flex-1"
                        placeholder="选择版本"
                      />
                      <NButton
                        v-if="!readonly"
                        size="small"
                        @click="showCreateVersion = !showCreateVersion"
                      >
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
                      <NButton
                        size="small"
                        type="primary"
                        @click="handleCreateVersion"
                      >
                        确定创建
                      </NButton>
                    </NSpace>
                  </div>

                  <!-- Version info -->
                  <div
                    v-if="selectedVersionInfo"
                    class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-800"
                  >
                    <div>版本号: {{ selectedVersionInfo.versionNumber }}</div>
                    <div>
                      状态:
                      <NTag :bordered="false" size="small">{{
                        statusLabel(selectedVersionInfo.status)
                      }}</NTag>
                    </div>
                    <div v-if="selectedVersionInfo.description" class="mt-1">
                      描述: {{ selectedVersionInfo.description }}
                    </div>
                  </div>

                  <!-- Version actions -->
                  <div
                    v-if="selectedVersionId && !readonly"
                    class="flex flex-wrap gap-2"
                  >
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

          <!-- Right: Graph Form (replaces Vue Flow canvas) -->
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
                v-if="!readonly"
                :disabled="!selectedVersionId"
                :loading="saving"
                size="small"
                type="primary"
                @click="handleSaveGraph"
              >
                保存 Graph
              </NButton>
            </NSpace>

            <!-- Form content area -->
            <div
              v-if="!selectedVersionId"
              class="flex flex-1 items-center justify-center"
            >
              <NEmpty description="请选择一个版本以编辑 Graph" />
            </div>
            <NSpin v-else :show="loading" class="flex-1">
              <div class="flex-1 space-y-4 overflow-auto p-3">
                <!-- Start/End node selectors -->
                <NSpace align="center" wrap>
                  <NSelect
                    v-model:value="startNode"
                    :options="nodeOptions"
                    :disabled="readonly"
                    placeholder="起始节点"
                    class="w-[200px]"
                    clearable
                  />
                  <NSelect
                    v-model:value="endNode"
                    :options="nodeOptions"
                    :disabled="readonly"
                    placeholder="结束节点"
                    class="w-[200px]"
                    clearable
                  />
                </NSpace>

                <!-- Nodes Table -->
                <div>
                  <NSpace align="center" class="mb-2">
                    <span class="text-sm font-bold">节点列表</span>
                    <NButton
                      v-if="!readonly"
                      size="small"
                      type="primary"
                      @click="openAddNode"
                    >
                      添加节点
                    </NButton>
                  </NSpace>
                  <NDataTable
                    :columns="nodeColumns"
                    :data="formNodes"
                    :max-height="280"
                    :bordered="true"
                    size="small"
                    :empty-text="'暂无节点，点击上方添加节点'"
                  />
                </div>

                <!-- Normal Edges Table -->
                <div>
                  <NSpace align="center" class="mb-2">
                    <span class="text-sm font-bold">普通连线</span>
                    <NButton
                      v-if="!readonly"
                      size="small"
                      type="primary"
                      @click="openAddEdge"
                    >
                      添加连线
                    </NButton>
                  </NSpace>
                  <NDataTable
                    :columns="normalEdgeColumns"
                    :data="normalEdges"
                    :max-height="200"
                    :bordered="true"
                    size="small"
                    :empty-text="'暂无普通连线'"
                  />
                </div>

                <!-- Conditional Edges Table -->
                <div>
                  <NSpace align="center" class="mb-2">
                    <span class="text-sm font-bold">条件连线</span>
                    <NButton
                      v-if="!readonly"
                      size="small"
                      type="primary"
                      @click="openAddConditionalEdge"
                    >
                      添加条件连线
                    </NButton>
                  </NSpace>
                  <NDataTable
                    :columns="conditionalEdgeColumns"
                    :data="conditionalEdges"
                    :max-height="200"
                    :bordered="true"
                    size="small"
                    :empty-text="'暂无条件连线'"
                  />
                </div>
              </div>
            </NSpin>
          </div>
        </div>
      </NSpin>
    </div>

    <!-- Add/Edit Node Modal -->
    <NModal
      v-model:show="showNodeModal"
      preset="card"
      :title="isNewNode ? '添加节点' : '编辑节点'"
      class="w-[480px]"
    >
      <NodeForm
        v-model:node-data="editingNode"
        :node-type-meta="nodeTypesMeta"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showNodeModal = false">取消</NButton>
          <NButton type="primary" @click="confirmNode">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Add Normal Edge Modal -->
    <NModal
      v-model:show="showEdgeModal"
      preset="card"
      title="添加连线"
      class="w-[420px]"
    >
      <NForm label-placement="top">
        <NFormItem label="源节点">
          <NSelect
            v-model:value="edgeSource"
            :options="nodeOptions"
            placeholder="选择源节点"
          />
        </NFormItem>
        <NFormItem label="目标节点">
          <NSelect
            v-model:value="edgeTarget"
            :options="nodeOptions"
            placeholder="选择目标节点"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEdgeModal = false">取消</NButton>
          <NButton type="primary" @click="confirmEdge">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Add Conditional Edge Modal -->
    <NModal
      v-model:show="showCondEdgeModal"
      preset="card"
      title="添加条件连线"
      class="w-[480px]"
    >
      <NForm label-placement="top">
        <NFormItem label="源节点">
          <NSelect
            v-model:value="condEdgeSource"
            :options="nodeOptions"
            placeholder="选择源节点"
          />
        </NFormItem>
        <NFormItem label="目标节点">
          <NSelect
            v-model:value="condEdgeTarget"
            :options="nodeOptions"
            placeholder="选择目标节点"
          />
        </NFormItem>
        <NFormItem label="条件类型">
          <NInput v-model:value="condEdgeType" placeholder="例如：classify" />
        </NFormItem>
        <NFormItem label="映射值">
          <NSelect
            v-model:value="condEdgeMapping"
            :disabled="condEdgeIsDefault"
            :options="condEdgeIntentOptions"
            placeholder="选择意图编码"
            :clearable="true"
            filterable
          />
        </NFormItem>
        <NFormItem>
          <NCheckbox v-model:checked="condEdgeIsDefault"> 默认目标 </NCheckbox>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCondEdgeModal = false">取消</NButton>
          <NButton type="primary" @click="confirmCondEdge">确定</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Validation Result Modal -->
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

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

import { $t } from '#/locales';
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
  { label: $t('agent.adminEditEnabled'), value: '1' },
  { label: $t('agent.adminEditDisabled'), value: '0' },
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
  { title: $t('agent.adminEditTableColumnName'), key: 'nodeName', width: 130 },
  { title: $t('agent.adminEditTableColumnType'), key: 'nodeType', width: 100 },
  {
    title: $t('agent.adminEditTableColumnStatus'),
    key: 'enabled',
    width: 70,
    render: (row: AgentGraphApi.FormNode) => (row.enabled ? $t('agent.adminEditEnabled') : $t('agent.adminEditDisabled')),
  },
  { title: $t('agent.adminEditTableColumnDescription'), key: 'description', ellipsis: { tooltip: true } },
  {
    title: $t('agent.adminEditTableColumnActions'),
    key: 'actions',
    width: 110,
    fixed: 'right' as const,
    render: (row: AgentGraphApi.FormNode) =>
      h(NSpace, {}, [
        h(NButton, { size: 'tiny', onClick: () => openEditNode(row) }, $t('agent.adminEditEditAction')),
        h(
          NButton,
          {
            size: 'tiny',
            type: 'error',
            onClick: () => handleDeleteNode(row.id),
          },
          $t('agent.adminEditDeleteAction'),
        ),
      ]),
  },
]);

const normalEdgeColumns = [
  { title: $t('agent.adminEditTableColumnSource'), key: 'source', width: 130 },
  { title: $t('agent.adminEditTableColumnTarget'), key: 'target', width: 130 },
  {
    title: $t('agent.adminEditTableColumnActions'),
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
        $t('agent.adminEditDeleteAction'),
      ),
  },
];

const conditionalEdgeColumns = [
  { title: $t('agent.adminEditTableColumnSource'), key: 'source', width: 120 },
  { title: $t('agent.adminEditTableColumnTarget'), key: 'target', width: 120 },
  { title: $t('agent.adminEditTableColumnConditionType'), key: 'conditionType', width: 90 },
  { title: $t('agent.adminEditTableColumnMappingValue'), key: 'conditionMapping', width: 90 },
  {
    title: $t('agent.adminEditTableColumnDefaultTarget'),
    key: 'isDefault',
    width: 80,
    render: (row: AgentGraphApi.FormEdge) => (row.isDefault ? $t('agent.adminEditYes') : $t('agent.adminEditNo')),
  },
  {
    title: $t('agent.adminEditTableColumnActions'),
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
        $t('agent.adminEditDeleteAction'),
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
    DRAFT: $t('agent.versionListDraft'),
    PUBLISHED: $t('agent.versionListPublishedText'),
    ARCHIVED: $t('agent.versionListArchivedText'),
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
    message.error($t('agent.adminEditFillRequired'));
    return;
  }
  try {
    const vo = await createAgent({
      agentId: agentId.value,
      name: agentName.value,
      description: agentDescription.value,
      status: agentStatus.value,
    });
    message.success($t('agent.adminEditCreated'));
    agentDetailId.value = vo.id;
  } catch {
    message.error($t('agent.adminEditCreateFailed'));
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
    message.success($t('agent.adminEditSaveSuccess'));
  } catch {
    message.error($t('agent.adminEditSaveFailed'));
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
    message.success($t('agent.adminEditGraphSaved'));
  } catch {
    message.error($t('agent.adminEditGraphSaveFailed'));
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
    message.warning($t('agent.adminEditSelectSourceAndTarget'));
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
    message.warning($t('agent.adminEditSelectSourceAndTarget'));
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
    message.success($t('agent.adminEditVersionCreated'));
    showCreateVersion.value = false;
    newVersionNumber.value = '';
    newVersionDesc.value = '';
    await loadVersions();
  } catch {
    message.error($t('agent.adminEditVersionCreateFailed'));
  }
}

async function handlePublish() {
  if (!agentId.value || !selectedVersionId.value) return;
  const info = selectedVersionInfo.value;
  if (info && info.status === 'PUBLISHED') {
    message.warning($t('agent.adminEditVersionAlreadyPublished'));
    return;
  }
  try {
    await publishVersion(agentId.value, selectedVersionId.value);
    message.success($t('agent.adminEditVersionPublished'));
    await loadVersions();
  } catch {
    message.error($t('agent.adminEditVersionPublishFailed'));
  }
}

async function handleActivate() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    await activateVersion(agentId.value, selectedVersionId.value);
    message.success($t('agent.adminEditVersionActivated'));
  } catch {
    message.error($t('agent.adminEditVersionActivateFailed'));
  }
}

async function handleArchive() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    await archiveVersion(agentId.value, selectedVersionId.value);
    message.success($t('agent.adminEditVersionArchived'));
    await loadVersions();
  } catch {
    message.error($t('agent.adminEditVersionArchiveFailed'));
  }
}

async function handleDeleteVersion() {
  if (!agentId.value || !selectedVersionId.value) return;
  try {
    await deleteVersion(agentId.value, selectedVersionId.value);
    message.success($t('agent.adminEditVersionDeleted'));
    selectedVersionId.value = null;
    await loadVersions();
  } catch {
    message.error($t('agent.adminEditVersionDeleteFailed'));
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
        <NButton @click="onBack">{{ $t('agent.adminEditBackToList') }}</NButton>
        <span v-if="agentDetailId" class="text-lg font-semibold">{{
          agentName || $t('agent.adminEditLoading')
        }}</span>
        <span v-else-if="isNew" class="text-lg font-semibold">{{ $t('agent.adminEditAddAgent') }}</span>
        <span v-else class="text-lg font-semibold">{{ $t('agent.adminEditAgentManage') }}</span>
        <div class="flex-1" />
        <NTag
          v-if="readonly && agentDetailId"
          :bordered="false"
          type="info"
          size="small"
          >{{ $t('agent.adminEditReadOnly') }}</NTag
        >
      </NSpace>

      <!-- Agent selector (direct entry without id) -->
      <div v-if="!agentDetailId && !isNew" class="flex items-center gap-2 p-4">
        <span class="text-sm font-medium whitespace-nowrap">{{ $t('agent.adminEditSelectAgent') }}</span>
        <NSelect
          v-model:value="selectedAgentId"
          :loading="loadingOptions"
          :options="agentOptions"
          class="w-[320px]"
          :placeholder="$t('agent.adminEditSelectAgentPlaceholder')"
          @update:value="(val: any) => (selectedAgentId = val)"
        />
      </div>

      <!-- New agent form (isNew mode) -->
      <div v-if="isNew" class="max-w-[480px] space-y-3">
        <NForm label-placement="top" label-width="auto">
          <NGrid :cols="1" :x-gap="12">
            <NGi>
              <NFormItemGi :label="$t('agent.adminEditAgentId')">
                <NInput
                  v-model:value="agentId"
                  :placeholder="$t('agent.adminEditAgentIdPlaceholder')"
                />
              </NFormItemGi>
            </NGi>
            <NGi>
              <NFormItemGi :label="$t('agent.adminEditName')">
                <NInput v-model:value="agentName" :placeholder="$t('agent.adminEditNamePlaceholder')" />
              </NFormItemGi>
            </NGi>
            <NGi>
              <NFormItemGi :label="$t('agent.description')">
                <NInput
                  v-model:value="agentDescription"
                  :maxlength="500"
                  :rows="2"
                  :placeholder="$t('agent.adminEditDescriptionPlaceholder')"
                  type="textarea"
                />
              </NFormItemGi>
            </NGi>
            <NGi>
              <NFormItemGi :label="$t('agent.adminEditStatus')">
                <NSelect v-model:value="agentStatus" :options="statusOptions" />
              </NFormItemGi>
            </NGi>
          </NGrid>
          <NButton type="primary" @click="handleCreateNewAgent"
            >{{ $t('agent.adminEditCreateAgent') }}</NButton
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
                <template #header><span>{{ $t('agent.adminEditBasicInfo') }}</span></template>
                <NForm label-placement="top" label-width="auto">
                  <NGrid :cols="1" :x-gap="12">
                    <NGi>
                      <NFormItemGi :label="$t('agent.adminEditAgentId')">
                        <NInput
                          v-model:value="agentId"
                          :disabled="true"
                          :placeholder="$t('agent.adminEditAgentIdPlaceholderReadonly')"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi :label="$t('agent.adminEditName')">
                        <NInput
                          v-model:value="agentName"
                          :disabled="readonly"
                          :placeholder="$t('agent.adminEditNamePlaceholder')"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi :label="$t('agent.description')">
                        <NInput
                          v-model:value="agentDescription"
                          :disabled="readonly"
                          :maxlength="500"
                          :rows="2"
                          :placeholder="$t('agent.adminEditDescriptionPlaceholder')"
                          type="textarea"
                        />
                      </NFormItemGi>
                    </NGi>
                    <NGi>
                      <NFormItemGi :label="$t('agent.adminEditStatus')">
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
                      >{{ $t('agent.adminEditSaveInfo') }}</NButton
                    >
                  </div>
                </NForm>
              </NCollapseItem>
            </NCollapse>

            <!-- Version Control Section -->
            <NCollapse :default-expanded-names="['version']">
              <NCollapseItem name="version">
                <template #header><span>{{ $t('agent.adminEditVersionManagement') }}</span></template>
                <div class="space-y-3">
                  <NSpace vertical>
                    <label class="text-sm font-medium">{{ $t('agent.adminEditSelectVersion') }}</label>
                    <NSpace>
                      <NSelect
                        v-model:value="selectedVersionId"
                        :disabled="versions.length === 0 || readonly"
                        :loading="loadingVersions"
                        :options="versions"
                        class="flex-1"
                        :placeholder="$t('agent.adminEditSelectVersionPlaceholder')"
                      />
                      <NButton
                        v-if="!readonly"
                        size="small"
                        @click="showCreateVersion = !showCreateVersion"
                      >
                        {{ $t('agent.adminEditCreateVersion') }}
                      </NButton>
                    </NSpace>
                  </NSpace>

                  <!-- Quick create version -->
                  <div v-if="showCreateVersion" class="rounded border p-2">
                    <NSpace vertical>
                      <NInput
                        v-model:value="newVersionNumber"
                        :placeholder="$t('agent.adminEditVersionNumberPlaceholder')"
                        size="small"
                      />
                      <NInput
                        v-model:value="newVersionDesc"
                        :maxlength="500"
                        :rows="1"
                        :placeholder="$t('agent.adminEditVersionDescPlaceholder')"
                        size="small"
                        type="textarea"
                      />
                      <NButton
                        size="small"
                        type="primary"
                        @click="handleCreateVersion"
                      >
                         {{ $t('agent.adminEditConfirmCreate') }}
                       </NButton>
                    </NSpace>
                  </div>

                  <!-- Version info -->
                  <div
                    v-if="selectedVersionInfo"
                    class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-800"
                  >
                    <div>{{ $t('agent.adminEditVersionPrefix') }}: {{ selectedVersionInfo.versionNumber }}</div>
                    <div>
                      {{ $t('agent.adminEditStatus') }}:
                      <NTag :bordered="false" size="small">{{
                        statusLabel(selectedVersionInfo.status)
                      }}</NTag>
                    </div>
                    <div v-if="selectedVersionInfo.description" class="mt-1">
                       {{ $t('agent.description') }}: {{ selectedVersionInfo.description }}
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
                      {{ $t('agent.adminEditPublish') }}
                    </NButton>
                    <NButton
                      v-if="selectedVersionInfo?.status === 'PUBLISHED'"
                      size="small"
                      type="success"
                      @click="handleActivate"
                    >
                      {{ $t('agent.adminEditActivate') }}
                    </NButton>
                    <NButton
                      v-if="selectedVersionInfo?.status === 'PUBLISHED'"
                      size="small"
                      @click="handleArchive"
                    >
                      {{ $t('agent.adminEditArchive') }}
                    </NButton>
                    <NPopconfirm @positive-click="handleDeleteVersion">
                      <template #trigger>
                        <NButton size="small" type="error">{{ $t('agent.adminEditDeleteVersion') }}</NButton>
                      </template>
                      {{ $t('agent.adminEditConfirmDeleteVersion') }}
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
                {{ $t('agent.adminEditGraphEditor') }}
                <span v-if="selectedVersionInfo">
                  {{ $t('agent.adminEditVersionPrefix') }} {{ selectedVersionInfo.versionNumber }}
                </span>
                <span v-else class="text-gray-400">{{ $t('agent.adminEditSelectVersionHint') }}</span>
              </span>
              <div class="flex-1"></div>
              <NButton
                :disabled="!selectedVersionId"
                size="small"
                @click="handleValidate"
              >
                {{ $t('agent.adminEditValidate') }}
              </NButton>
              <NButton
                v-if="!readonly"
                :disabled="!selectedVersionId"
                :loading="saving"
                size="small"
                type="primary"
                @click="handleSaveGraph"
              >
                {{ $t('agent.adminEditSaveGraph') }}
              </NButton>
            </NSpace>

            <!-- Form content area -->
            <div
              v-if="!selectedVersionId"
              class="flex flex-1 items-center justify-center"
            >
              <NEmpty :description="$t('agent.adminEditSelectVersionForGraph')" />
            </div>
            <NSpin v-else :show="loading" class="flex-1">
              <div class="flex-1 space-y-4 overflow-auto p-3">
                <!-- Start/End node selectors -->
                <NSpace align="center" wrap>
                  <NSelect
                    v-model:value="startNode"
                    :options="nodeOptions"
                    :disabled="readonly"
                    :placeholder="$t('agent.adminEditStartNode')"
                    class="w-[200px]"
                    clearable
                  />
                  <NSelect
                    v-model:value="endNode"
                    :options="nodeOptions"
                    :disabled="readonly"
                    :placeholder="$t('agent.adminEditEndNode')"
                    class="w-[200px]"
                    clearable
                  />
                </NSpace>

                <!-- Nodes Table -->
                <div>
                  <NSpace align="center" class="mb-2">
                    <span class="text-sm font-bold">{{ $t('agent.adminEditNodeList') }}</span>
                    <NButton
                      v-if="!readonly"
                      size="small"
                      type="primary"
                      @click="openAddNode"
                      >
                       {{ $t('agent.adminEditAddNode') }}
                     </NButton>
                  </NSpace>
                  <NDataTable
                    :columns="nodeColumns"
                    :data="formNodes"
                    :max-height="280"
                    :bordered="true"
                    size="small"
                    :empty-text="$t('agent.adminEditNoNodeHint')"
                  />
                </div>

                <!-- Normal Edges Table -->
                <div>
                  <NSpace align="center" class="mb-2">
                    <span class="text-sm font-bold">{{ $t('agent.adminEditNormalEdges') }}</span>
                    <NButton
                      v-if="!readonly"
                      size="small"
                      type="primary"
                      @click="openAddEdge"
                    >
                      {{ $t('agent.adminEditAddEdge') }}
                    </NButton>
                  </NSpace>
                  <NDataTable
                    :columns="normalEdgeColumns"
                    :data="normalEdges"
                    :max-height="200"
                    :bordered="true"
                    size="small"
                    :empty-text="$t('agent.adminEditNoNormalEdge')"
                  />
                </div>

                <!-- Conditional Edges Table -->
                <div>
                  <NSpace align="center" class="mb-2">
                    <span class="text-sm font-bold">{{ $t('agent.adminEditConditionalEdges') }}</span>
                    <NButton
                      v-if="!readonly"
                      size="small"
                      type="primary"
                      @click="openAddConditionalEdge"
                    >
                      {{ $t('agent.adminEditAddCondEdge') }}
                    </NButton>
                  </NSpace>
                  <NDataTable
                    :columns="conditionalEdgeColumns"
                    :data="conditionalEdges"
                    :max-height="200"
                    :bordered="true"
                    size="small"
                    :empty-text="$t('agent.adminEditNoCondEdge')"
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
      :title="isNewNode ? $t('agent.adminEditAddNodeModal') : $t('agent.adminEditEditNodeModal')"
      class="w-[480px]"
    >
      <NodeForm
        v-model:node-data="editingNode"
        :node-type-meta="nodeTypesMeta"
      />
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showNodeModal = false">{{ $t('agent.adminEditCancel') }}</NButton>
          <NButton type="primary" @click="confirmNode">{{ $t('agent.adminEditConfirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Add Normal Edge Modal -->
    <NModal
      v-model:show="showEdgeModal"
      preset="card"
      :title="$t('agent.adminEditAddEdgeModal')"
      class="w-[420px]"
    >
      <NForm label-placement="top">
        <NFormItem :label="$t('agent.adminEditSourceNode')">
          <NSelect
            v-model:value="edgeSource"
            :options="nodeOptions"
            :placeholder="$t('agent.adminEditSourceNodePlaceholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('agent.adminEditTargetNode')">
          <NSelect
            v-model:value="edgeTarget"
            :options="nodeOptions"
            :placeholder="$t('agent.adminEditTargetNodePlaceholder')"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showEdgeModal = false">{{ $t('agent.adminEditCancel') }}</NButton>
          <NButton type="primary" @click="confirmEdge">{{ $t('agent.adminEditConfirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Add Conditional Edge Modal -->
    <NModal
      v-model:show="showCondEdgeModal"
      preset="card"
      :title="$t('agent.adminEditAddCondEdgeModal')"
      class="w-[480px]"
    >
      <NForm label-placement="top">
        <NFormItem :label="$t('agent.adminEditSourceNode')">
          <NSelect
            v-model:value="condEdgeSource"
            :options="nodeOptions"
            :placeholder="$t('agent.adminEditSourceNodePlaceholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('agent.adminEditTargetNode')">
          <NSelect
            v-model:value="condEdgeTarget"
            :options="nodeOptions"
            :placeholder="$t('agent.adminEditTargetNodePlaceholder')"
          />
        </NFormItem>
        <NFormItem :label="$t('agent.adminEditConditionType')">
          <NInput v-model:value="condEdgeType" :placeholder="$t('agent.adminEditConditionTypePlaceholder')" />
        </NFormItem>
        <NFormItem :label="$t('agent.adminEditMappingValue')">
          <NSelect
            v-model:value="condEdgeMapping"
            :disabled="condEdgeIsDefault"
            :options="condEdgeIntentOptions"
            :placeholder="$t('agent.adminEditMappingValuePlaceholder')"
            :clearable="true"
            filterable
          />
        </NFormItem>
        <NFormItem>
          <NCheckbox v-model:checked="condEdgeIsDefault"> {{ $t('agent.adminEditDefaultTarget') }} </NCheckbox>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="showCondEdgeModal = false">{{ $t('agent.adminEditCancel') }}</NButton>
          <NButton type="primary" @click="confirmCondEdge">{{ $t('agent.adminEditConfirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>

    <!-- Validation Result Modal -->
    <NModal
      v-model:show="showValidateResult"
      preset="card"
      :title="$t('agent.adminEditValidationResult')"
      class="w-[480px]"
    >
      <ValidateResult :result="validationResult" />
    </NModal>
  </Page>
</template>

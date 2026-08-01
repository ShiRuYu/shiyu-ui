<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import { computed, h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
  NInputNumber,
  NSelect,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { getKnowledgePoints } from '#/api/knowledge/point';
import {
  createKnowledgeRelation,
  deleteKnowledgeRelation,
  getKnowledgeRelations,
  type KnowledgeRelation,
} from '#/api/knowledge/relation';
import { dialog } from '#/adapter/naive';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '../components/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';
import { getStatusLabel, relationTypeOptions } from '../constants/status';

const route = useRoute();
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const options = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<number>();
const relations = ref<KnowledgeRelation[]>([]);
const loading = ref(false);
const saving = ref(false);
const targetId = ref<number>();
const relationType = ref('PRE');
const weight = ref(1);
const incoming = computed(() =>
  relations.value.filter((item) => item.targetId === selectedId.value),
);
const outgoing = computed(() =>
  relations.value.filter((item) => item.sourceId === selectedId.value),
);
const availableTargets = computed(() =>
  options.value.filter((item) => item.value !== selectedId.value),
);
const currentTypeDescription = computed(
  () =>
    relationTypeOptions.find((item) => item.value === relationType.value)
      ?.description,
);

async function loadOptions(reset = false) {
  if (!activeSpaceId.value) {
    options.value = [];
    selectedId.value = undefined;
    relations.value = [];
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
  const queryId = Number(route.query.pointId);
  if (reset || !options.value.some((item) => item.value === selectedId.value)) {
    selectedId.value = options.value.some((item) => item.value === queryId)
      ? queryId
      : options.value[0]?.value;
  }
}
async function loadRelations() {
  targetId.value = undefined;
  if (!selectedId.value) {
    relations.value = [];
    return;
  }
  loading.value = true;
  try {
    relations.value = await getKnowledgeRelations(selectedId.value);
  } finally {
    loading.value = false;
  }
}
async function refresh(reset = false) {
  await loadOptions(reset);
  await loadRelations();
}
async function addRelation() {
  if (!selectedId.value || !targetId.value) return;
  if (selectedId.value === targetId.value) {
    message.warning('不能将知识点关联到自身');
    return;
  }
  const exists = relations.value.some(
    (item) =>
      item.sourceId === selectedId.value &&
      item.targetId === targetId.value &&
      item.relationType === relationType.value,
  );
  if (exists) {
    message.warning('该关系已存在，请勿重复添加');
    return;
  }
  saving.value = true;
  try {
    await createKnowledgeRelation({
      sourceId: selectedId.value,
      targetId: targetId.value,
      type: relationType.value,
      weight: weight.value,
    });
    message.success('知识关系已建立');
    await loadRelations();
  } finally {
    saving.value = false;
  }
}
function removeRelation(row: KnowledgeRelation) {
  dialog.warning({
    title: '移除知识关系',
    content: `确认移除“${getStatusLabel(row.relationType)}”关系吗？`,
    negativeText: '取消',
    positiveText: '移除',
    onPositiveClick: async () => {
      await deleteKnowledgeRelation(
        row.sourceId,
        row.targetId,
        row.relationType,
      );
      message.success('关系已移除');
      await loadRelations();
    },
  });
}
const columns: DataTableColumns<KnowledgeRelation> = [
  {
    key: 'direction',
    title: '关系方向',
    minWidth: 260,
    render: (row) =>
      row.sourceId === selectedId.value
        ? `当前节点 → ${row.target?.name || row.targetId}`
        : `${row.source?.name || row.sourceId} → 当前节点`,
  },
  {
    key: 'relationType',
    title: '类型',
    width: 100,
    render: (row) =>
      h(
        NTag,
        { type: 'info' },
        { default: () => getStatusLabel(row.relationType) },
      ),
  },
  { key: 'weight', title: '权重', width: 90 },
  {
    key: 'action',
    title: '操作',
    width: 100,
    render: (row) =>
      h(
        NButton,
        { size: 'small', type: 'error', onClick: () => removeRelation(row) },
        { default: () => '移除' },
      ),
  },
];
onMounted(async () => {
  await store.loadSpaces();
  await refresh(true);
});
</script>

<template>
  <Page
    title="关系编排"
    description="管理知识点之间的方向、类型和权重，保持知识网络可解释。"
  >
    <KnowledgeSpaceHeader :loading="loading" @refresh="refresh(true)" />
    <NCard :bordered="false">
      <div class="grid gap-3 lg:grid-cols-[1.2fr_1.2fr_160px_130px_auto]">
        <NSelect
          v-model:value="selectedId"
          :options="options"
          filterable
          placeholder="选择当前知识点"
          @update:value="loadRelations"
        />
        <NSelect
          v-model:value="targetId"
          :options="availableTargets"
          filterable
          placeholder="选择目标知识点"
        />
        <NSelect v-model:value="relationType" :options="relationTypeOptions" />
        <NInputNumber
          v-model:value="weight"
          :min="0"
          :max="10"
          :step="0.1"
          placeholder="权重"
        />
        <NButton
          type="primary"
          :loading="saving"
          :disabled="!selectedId || !targetId"
          @click="addRelation"
          >建立关系</NButton
        >
      </div>
      <div class="mt-2 text-xs text-muted-foreground">
        {{ currentTypeDescription }}
      </div>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <NCard size="small"
          ><div class="text-sm text-muted-foreground">关系总数</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ relations.length }}
          </div></NCard
        >
        <NCard size="small"
          ><div class="text-sm text-muted-foreground">当前节点发出</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ outgoing.length }}
          </div></NCard
        >
        <NCard size="small"
          ><div class="text-sm text-muted-foreground">当前节点接收</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ incoming.length }}
          </div></NCard
        >
      </div>
      <NDataTable
        v-if="relations.length || loading"
        class="mt-5"
        :bordered="false"
        :columns="columns"
        :data="relations"
        :loading="loading"
      />
      <KnowledgeEmptyState
        v-else
        class="mt-5"
        :description="
          selectedId
            ? '当前知识点暂无关系，请在上方建立关系'
            : '当前空间暂无知识点'
        "
      />
    </NCard>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NDataTable,
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
import { useKnowledgeStore } from '#/store';
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId, spaceOptions } = storeToRefs(store);
const options = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<number>();
const relations = ref<KnowledgeRelation[]>([]);
const loading = ref(false);
const targetId = ref<number>();
const incoming = computed(() =>
  relations.value.filter((item) => item.targetId === selectedId.value),
);
const outgoing = computed(() =>
  relations.value.filter((item) => item.sourceId === selectedId.value),
);
async function loadOptions() {
  if (!activeSpaceId.value) return;
  options.value = (
    await getKnowledgePoints(activeSpaceId.value, {
      pageNum: 1,
      pageSize: 1000,
    })
  ).items.map((item) => ({
    label: `${item.code} · ${item.name}`,
    value: item.id,
  }));
  if (!selectedId.value) selectedId.value = options.value[0]?.value;
}
async function loadRelations() {
  if (!selectedId.value) return;
  loading.value = true;
  try {
    relations.value = await getKnowledgeRelations(selectedId.value);
  } finally {
    loading.value = false;
  }
}
async function addRelation() {
  if (!selectedId.value || !targetId.value) return;
  await createKnowledgeRelation({
    sourceId: selectedId.value,
    targetId: targetId.value,
    type: 'PRE',
    weight: 1,
  });
  targetId.value = undefined;
  message.success('关系已添加');
  await loadRelations();
}
async function removeRelation(row: KnowledgeRelation) {
  const source =
    row.sourceId === selectedId.value ? row.sourceId : row.targetId;
  const target =
    row.sourceId === selectedId.value ? row.targetId : row.sourceId;
  await deleteKnowledgeRelation(source, target, row.relationType);
  message.success('关系已删除');
  await loadRelations();
}
async function changeSpace(value: number) {
  store.setActiveSpace(value);
  await loadOptions();
  await loadRelations();
}
onMounted(async () => {
  await store.loadSpaces();
  await loadOptions();
  await loadRelations();
});
const columns = [
  {
    title: '关系方向',
    key: 'direction',
    render: (row: KnowledgeRelation) =>
      row.sourceId === selectedId.value
        ? '当前节点 → 目标节点'
        : '来源节点 → 当前节点',
  },
  {
    title: '关联节点',
    key: 'target',
    render: (row: KnowledgeRelation) =>
      row.sourceId === selectedId.value ? row.target?.name : row.source?.name,
  },
  {
    title: '类型',
    key: 'relationType',
    render: (row: KnowledgeRelation) =>
      h(NTag, { type: 'info' }, { default: () => row.relationType }),
  },
  {
    title: '操作',
    key: 'action',
    render: (row: KnowledgeRelation) =>
      h(
        NButton,
        { size: 'small', type: 'error', onClick: () => removeRelation(row) },
        { default: () => '移除' },
      ),
  },
];
import { h } from 'vue';
</script>
<template>
  <Page
    title="关系编排"
    description="管理知识点之间的前置、后续和关联关系，保证知识网络可解释、可导航。"
    >
<NCard :bordered="false"
      >
<div class="flex flex-wrap gap-3">
        <NSelect
          :value="activeSpaceId"
          :options="spaceOptions"
          class="w-56"
          @update:value="changeSpace"
        /><NSelect
          v-model:value="selectedId"
          :options="options"
          filterable
          class="w-72"
          placeholder="选择知识点"
          @update:value="loadRelations"
        /><NSelect
          v-model:value="targetId"
          :options="options.filter((item) => item.value !== selectedId)"
          filterable
          class="w-72"
          placeholder="选择关联目标"
        /><NButton type="primary" :disabled="!targetId" @click="addRelation"
          >
建立前置关系
</NButton
        >
      </div>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-lg bg-indigo-50 p-4">
          <div class="text-sm text-indigo-600">关系总数</div>
          <div class="mt-2 text-2xl font-semibold">{{ relations.length }}</div>
        </div>
        <div class="rounded-lg bg-emerald-50 p-4">
          <div class="text-sm text-emerald-600">前置关系</div>
          <div class="mt-2 text-2xl font-semibold">{{ outgoing.length }}</div>
        </div>
        <div class="rounded-lg bg-amber-50 p-4">
          <div class="text-sm text-amber-600">被依赖关系</div>
          <div class="mt-2 text-2xl font-semibold">{{ incoming.length }}</div>
        </div>
      </div>
      <NDataTable
        class="mt-5"
        :columns="columns"
        :data="relations"
        :loading="loading"
        :bordered="false" />
</NCard
  >
</Page>
</template>

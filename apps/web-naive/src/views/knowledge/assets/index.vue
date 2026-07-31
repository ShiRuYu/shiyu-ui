<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NDataTable, NInput, NSelect, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import { getKnowledgePoints, type KnowledgePoint } from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';
const store = useKnowledgeStore();
const { activeSpaceId, spaceOptions } = storeToRefs(store);
const rows = ref<KnowledgePoint[]>([]);
const keyword = ref('');
const loading = ref(false);
async function load() {
  if (!activeSpaceId.value) return;
  loading.value = true;
  try {
    rows.value = (
      await getKnowledgePoints(activeSpaceId.value, {
        pageNum: 1,
        pageSize: 50,
        keyword: keyword.value || undefined,
      })
    ).items;
  } finally {
    loading.value = false;
  }
}
async function changeSpace(value: number) {
  store.setActiveSpace(value);
  await load();
}
onMounted(async () => {
  await store.loadSpaces();
  await load();
});
const columns = [
  { title: '名称', key: 'name', minWidth: 220 },
  { title: '编码', key: 'code', width: 150 },
  { title: '分类', key: 'category', width: 140 },
  {
    title: '难度',
    key: 'difficultyLevel',
    width: 90,
    render: (row: KnowledgePoint) => row.difficultyLevel ?? '-',
  },
  { title: '标签', key: 'tags' },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: () =>
      h(NTag, { type: 'success' }, { default: () => '已纳入知识库' }),
  },
];
import { h } from 'vue';
</script>
<template>
  <Page
    title="知识资产"
    description="维护知识点本体与文档入口，关注覆盖范围、规范性和可复用性。"
  >
    <NCard :bordered="false">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap gap-3">
          <NSelect
            :value="activeSpaceId"
            :options="spaceOptions"
            class="w-56"
            @update:value="changeSpace"
          /><NInput
            v-model:value="keyword"
            placeholder="搜索知识点名称、编码或分类"
            class="w-72"
            @keyup.enter="load"
          /><NButton type="primary" @click="load">查询</NButton>
        </div>
        <NButton type="primary">新增知识点</NButton>
      </div>
      <div class="mt-5 grid gap-3 md:grid-cols-3">
        <div class="rounded-lg bg-indigo-50 p-4">
          <div class="text-sm text-indigo-600">资产总量</div>
          <div class="mt-2 text-2xl font-semibold">{{ rows.length }}</div>
        </div>
        <div class="rounded-lg bg-emerald-50 p-4">
          <div class="text-sm text-emerald-600">有分类</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ rows.filter((item) => item.category).length }}
          </div>
        </div>
        <div class="rounded-lg bg-amber-50 p-4">
          <div class="text-sm text-amber-600">待补充描述</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ rows.filter((item) => !item.description).length }}
          </div>
        </div>
      </div>
      <NDataTable
        class="mt-5"
        :columns="columns"
        :data="rows"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :bordered="false"
      />
    </NCard>
  </Page>
</template>

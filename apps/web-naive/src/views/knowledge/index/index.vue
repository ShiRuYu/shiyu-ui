<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NProgress,
  NSelect,
  NTag,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  type EmbeddedRuntimeStatus,
  getEmbeddedRuntimeStatus,
  getJobs,
  type IngestionJob,
  rebuildSpaceIndex,
} from '#/api/knowledge/enterprise';
import { useKnowledgeStore } from '#/store';
const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId, activeSpace, spaceOptions } = storeToRefs(store);
const jobs = ref<IngestionJob[]>([]);
const runtime = ref<EmbeddedRuntimeStatus>();
const loading = ref(false);
const rebuilding = ref(false);
const failed = computed(
  () => jobs.value.filter((item) => item.status === 'FAILED').length,
);
async function load() {
  if (!activeSpaceId.value) return;
  loading.value = true;
  try {
    jobs.value = (
      await getJobs({ pageNum: 1, pageSize: 50, spaceId: activeSpaceId.value })
    ).items;
    runtime.value = await getEmbeddedRuntimeStatus();
  } finally {
    loading.value = false;
  }
}
async function rebuild() {
  if (!activeSpaceId.value) return;
  rebuilding.value = true;
  try {
    await rebuildSpaceIndex(activeSpaceId.value);
    message.success('索引重建任务已提交');
    await load();
  } finally {
    rebuilding.value = false;
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
  {
    title: '任务',
    key: 'id',
    width: 90,
    render: (row: IngestionJob) => `#${row.id}`,
  },
  { title: '阶段', key: 'stage' },
  {
    title: '状态',
    key: 'status',
    width: 120,
    render: (row: IngestionJob) =>
      h(
        NTag,
        {
          type:
            row.status === 'FAILED'
              ? 'error'
              : row.status === 'SUCCEEDED'
                ? 'success'
                : 'warning',
        },
        { default: () => row.status },
      ),
  },
  {
    title: '进度',
    key: 'progress',
    minWidth: 200,
    render: (row: IngestionJob) =>
      h(NProgress, {
        percentage: row.progress,
        status: row.status === 'FAILED' ? 'error' : 'default',
      }),
  },
];
import { h } from 'vue';
</script>
<template>
  <Page
    title="索引与任务"
    description="观察解析、切分、向量化和索引重建的运行状态，确保知识库可检索。"
    >
<div class="space-y-4">
      <NCard :bordered="false"
        >
<div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="text-lg font-semibold">
              {{ activeSpace?.name || '未选择知识空间' }}
            </div>
            <div class="mt-1 text-sm text-slate-500">
              当前索引版本：{{ activeSpace?.activeIndexVersion ?? '-' }}
            </div>
          </div>
          <div class="flex flex-wrap gap-3">
            <NSelect
              :value="activeSpaceId"
              :options="spaceOptions"
              class="w-56"
              @update:value="changeSpace"
            /><NButton :loading="rebuilding" type="primary" @click="rebuild"
              >
重建当前空间索引
</NButton
            ><NButton @click="load">刷新</NButton>
          </div>
        </div>
</NCard
      >
      <div class="grid gap-3 md:grid-cols-3">
        <NCard size="small"
          >
<div class="text-sm text-slate-500">任务总数</div>
          <div class="mt-2 text-2xl font-semibold">
            {{ jobs.length }}
          </div>
</NCard
        ><NCard size="small"
          >
<div class="text-sm text-slate-500">异常任务</div>
          <div class="mt-2 text-2xl font-semibold text-red-500">
            {{ failed }}
          </div>
</NCard
        ><NCard size="small"
          >
<div class="text-sm text-slate-500">可用磁盘</div>
          <div class="mt-2 text-2xl font-semibold">
            {{
              runtime
                ? `${(runtime.usableBytes / 1024 / 1024 / 1024).toFixed(1)} GB`
                : '-'
            }}
          </div>
</NCard
        >
      </div>
      <NCard title="任务队列"
        >
<NAlert v-if="failed" type="warning" :bordered="false" class="mb-4"
          >
当前有
          {{ failed }} 个异常任务，建议先处理失败原因再重建索引。
</NAlert
        ><NDataTable
          :columns="columns"
          :data="jobs"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
          :bordered="false"
      />
</NCard>
</div
  >
</Page>
</template>

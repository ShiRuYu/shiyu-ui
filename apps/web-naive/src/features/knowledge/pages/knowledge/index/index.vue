<script setup lang="ts">
import type { DataTableColumns } from 'naive-ui';

import type {
  EmbeddedRuntimeStatus,
  IngestionJob,
  JobStatus,
} from '#/features/knowledge/api';

import {
  computed,
  h,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NDescriptions,
  NDescriptionsItem,
  NDrawer,
  NDrawerContent,
  NProgress,
  NSelect,
  NSwitch,
  useMessage,
} from 'naive-ui';
import { storeToRefs } from 'pinia';

import { dialog } from '#/adapter/naive';
import {
  cancelJob,
  getEmbeddedRuntimeStatus,
  getJobs,
  rebuildSpaceIndex,
  retryJob,
} from '#/features/knowledge/api';
import {
  getStageLabel,
  jobStatusOptions,
} from '#/features/knowledge/model/status';
import KnowledgeEmptyState from '#/features/knowledge/ui/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '#/features/knowledge/ui/knowledge-space-header.vue';
import KnowledgeStatusTag from '#/features/knowledge/ui/knowledge-status-tag.vue';
import { useKnowledgeStore } from '#/store';

const message = useMessage();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const jobs = ref<IngestionJob[]>([]);
const runtime = ref<EmbeddedRuntimeStatus>();
const loading = ref(false);
const rebuilding = ref(false);
const status = ref<JobStatus>();
const autoRefresh = ref(true);
const detail = ref<IngestionJob>();
const drawer = ref(false);
const total = ref(0);
const runningCount = ref(0);
const failedCount = ref(0);
const pagination = reactive({ page: 1, pageSize: 10 });
let timer: ReturnType<typeof setInterval> | undefined;
const failed = computed(() => failedCount.value);
const running = computed(() => runningCount.value);

async function load(silent = false) {
  if (!activeSpaceId.value) {
    jobs.value = [];
    total.value = 0;
    runningCount.value = 0;
    failedCount.value = 0;
    return;
  }
  if (!silent) loading.value = true;
  try {
    const [jobPage, runtimeStatus, pendingPage, runningPage, failedPage] =
      await Promise.all([
        getJobs({
          pageNum: pagination.page,
          pageSize: pagination.pageSize,
          spaceId: activeSpaceId.value,
          status: status.value,
        }),
        getEmbeddedRuntimeStatus(),
        getJobs({
          pageNum: 1,
          pageSize: 1,
          spaceId: activeSpaceId.value,
          status: 'PENDING',
        }),
        getJobs({
          pageNum: 1,
          pageSize: 1,
          spaceId: activeSpaceId.value,
          status: 'RUNNING',
        }),
        getJobs({
          pageNum: 1,
          pageSize: 1,
          spaceId: activeSpaceId.value,
          status: 'FAILED',
        }),
      ]);
    jobs.value = jobPage.items;
    total.value = jobPage.total;
    runningCount.value = pendingPage.total + runningPage.total;
    failedCount.value = failedPage.total;
    runtime.value = runtimeStatus;
  } finally {
    loading.value = false;
  }
}
function rebuild() {
  const spaceId = activeSpaceId.value;
  if (!spaceId) return;
  dialog.warning({
    title: '重建当前空间索引',
    content: '重建会创建后台任务，期间检索结果可能短暂使用旧索引。确认继续吗？',
    negativeText: '取消',
    positiveText: '提交重建',
    onPositiveClick: async () => {
      rebuilding.value = true;
      try {
        await rebuildSpaceIndex(spaceId);
        message.success('索引重建任务已提交');
        await load();
      } finally {
        rebuilding.value = false;
      }
    },
  });
}
async function retry(row: IngestionJob) {
  await retryJob(row.id);
  message.success(`任务 #${row.id} 已重新排队`);
  await load();
}
function cancel(row: IngestionJob) {
  dialog.warning({
    title: '取消任务',
    content: `确认取消任务 #${row.id} 吗？`,
    negativeText: '返回',
    positiveText: '确认取消',
    onPositiveClick: async () => {
      await cancelJob(row.id);
      message.success('任务已取消');
      await load();
    },
  });
}
function showDetail(row: IngestionJob) {
  detail.value = row;
  drawer.value = true;
}
const columns: DataTableColumns<IngestionJob> = [
  { key: 'id', title: '任务', width: 90, render: (row) => `#${row.id}` },
  {
    key: 'stage',
    title: '阶段',
    minWidth: 140,
    render: (row) => getStageLabel(row.stage),
  },
  {
    key: 'status',
    title: '状态',
    width: 110,
    render: (row) => h(KnowledgeStatusTag, { value: row.status }),
  },
  {
    key: 'attempts',
    title: '尝试',
    width: 90,
    render: (row) => `${row.attempts}/${row.maxAttempts}`,
  },
  {
    key: 'progress',
    title: '进度',
    minWidth: 180,
    render: (row) => {
      let progressStatus: 'default' | 'error' | 'success' = 'default';
      if (row.status === 'FAILED') progressStatus = 'error';
      if (row.status === 'SUCCEEDED') progressStatus = 'success';
      return h(NProgress, {
        percentage: row.progress,
        status: progressStatus,
      });
    },
  },
  {
    key: 'actions',
    title: '操作',
    width: 190,
    render: (row) =>
      h(
        'div',
        { class: 'flex gap-2' },
        [
          h(
            NButton,
            { size: 'small', onClick: () => showDetail(row) },
            { default: () => '详情' },
          ),
          row.status === 'FAILED' &&
            h(
              NButton,
              { size: 'small', type: 'primary', onClick: () => retry(row) },
              { default: () => '重试' },
            ),
          ['PENDING', 'RUNNING'].includes(row.status) &&
            h(
              NButton,
              { size: 'small', onClick: () => cancel(row) },
              { default: () => '取消' },
            ),
        ].filter(Boolean),
      ),
  },
];
watch(
  autoRefresh,
  (enabled) => {
    if (timer) clearInterval(timer);
    timer = enabled ? setInterval(() => load(true), 5000) : undefined;
  },
  { immediate: true },
);
onMounted(async () => {
  await store.loadSpaces();
  await load();
});
onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<template>
  <Page
    title="索引与任务"
    description="观察解析、切分、向量化和索引重建状态，及时处理异常任务。"
  >
    <KnowledgeSpaceHeader :loading="loading" @refresh="load" />
    <div class="grid gap-3 md:grid-cols-3">
      <NCard size="small">
        <div class="text-sm text-muted-foreground">任务总数</div>
        <div class="mt-2 text-2xl font-semibold">{{ total }}</div>
      </NCard>
      <NCard size="small">
        <div class="text-sm text-muted-foreground">处理中</div>
        <div class="mt-2 text-2xl font-semibold">{{ running }}</div>
      </NCard>
      <NCard size="small">
        <div class="text-sm text-muted-foreground">异常任务</div>
        <div class="mt-2 text-2xl font-semibold text-error">
          {{ failed }}
        </div>
      </NCard>
    </div>
    <NCard class="mt-4" title="任务队列" :bordered="false">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex gap-2">
          <NSelect
            v-model:value="status"
            clearable
            class="w-36"
            placeholder="全部状态"
            :options="jobStatusOptions"
            @update:value="
              () => {
                pagination.page = 1;
                load();
              }
            "
          />
          <NButton @click="load()">刷新</NButton>
          <div class="flex items-center gap-2 text-sm">
            <NSwitch v-model:value="autoRefresh" />每 5 秒自动刷新
          </div>
        </div>
        <NButton
          type="primary"
          :loading="rebuilding"
          :disabled="!activeSpaceId"
          @click="rebuild"
        >
          重建当前空间索引
        </NButton>
      </div>
      <NAlert v-if="failed" type="warning" :bordered="false" class="mb-4">
        当前有
        {{ failed }}
        个异常任务。建议先查看错误详情并重试，再决定是否重建索引。
      </NAlert>
      <NDataTable
        v-if="jobs.length || loading"
        remote
        :bordered="false"
        :columns="columns"
        :data="jobs"
        :loading="loading"
        :pagination="{
          page: pagination.page,
          pageSize: pagination.pageSize,
          itemCount: total,
          showSizePicker: true,
          pageSizes: [10, 20, 50],
          onChange: (page: number) => {
            pagination.page = page;
            load();
          },
          onUpdatePageSize: (size: number) => {
            pagination.pageSize = size;
            pagination.page = 1;
            load();
          },
        }"
      />
      <KnowledgeEmptyState v-else description="当前筛选条件下暂无任务" />
    </NCard>

    <NDrawer v-model:show="drawer" :width="560">
      <NDrawerContent
        :title="detail ? `任务 #${detail.id}` : '任务详情'"
        closable
      >
        <NDescriptions
          v-if="detail"
          bordered
          label-placement="left"
          :column="1"
        >
          <NDescriptionsItem label="状态">
            <KnowledgeStatusTag :value="detail.status" />
          </NDescriptionsItem>
          <NDescriptionsItem label="任务类型">
            {{ detail.jobType }}
          </NDescriptionsItem>
          <NDescriptionsItem label="处理阶段">
            {{ getStageLabel(detail.stage) }}
          </NDescriptionsItem>
          <NDescriptionsItem label="处理进度">
            {{ detail.progress }}%
          </NDescriptionsItem>
          <NDescriptionsItem label="尝试次数">
            {{ detail.attempts }}/{{ detail.maxAttempts }}
          </NDescriptionsItem>
          <NDescriptionsItem label="文档 ID">
            {{ detail.documentId || '-' }}
          </NDescriptionsItem>
          <NDescriptionsItem label="创建时间">
            {{ new Date(detail.createTime).toLocaleString() }}
          </NDescriptionsItem>
          <NDescriptionsItem label="开始时间">
            {{
              detail.startedTime
                ? new Date(detail.startedTime).toLocaleString()
                : '-'
            }}
          </NDescriptionsItem>
          <NDescriptionsItem label="完成时间">
            {{
              detail.finishedTime
                ? new Date(detail.finishedTime).toLocaleString()
                : '-'
            }}
          </NDescriptionsItem>
          <NDescriptionsItem label="错误信息">
            <span class="whitespace-pre-wrap text-error">{{
              detail.errorMessage || '-'
            }}</span>
          </NDescriptionsItem>
        </NDescriptions>
      </NDrawerContent>
    </NDrawer>
  </Page>
</template>

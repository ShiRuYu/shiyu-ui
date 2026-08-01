<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NStatistic, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  getDocuments,
  getJobs,
  type IngestionJob,
  type KnowledgeDocument,
} from '#/api/knowledge/enterprise';
import { getKnowledgePoints } from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';

import KnowledgeEmptyState from '../components/knowledge-empty-state.vue';
import KnowledgeSpaceHeader from '../components/knowledge-space-header.vue';
import KnowledgeStatusTag from '../components/knowledge-status-tag.vue';
import { getStageLabel } from '../constants/status';

const router = useRouter();
const store = useKnowledgeStore();
const { activeSpaceId } = storeToRefs(store);
const documents = ref<KnowledgeDocument[]>([]);
const jobs = ref<IngestionJob[]>([]);
const pointCount = ref(0);
const documentTotal = ref(0);
const processingJobCount = ref(0);
const failedJobCount = ref(0);
const reviewingDocumentCount = ref(0);
const parseFailedDocumentCount = ref(0);
const loading = ref(false);

const processingJobs = computed(() => processingJobCount.value);
const reviewingDocuments = computed(() => reviewingDocumentCount.value);
const parseFailedDocuments = computed(() => parseFailedDocumentCount.value);
const todos = computed(() => [
  {
    count: failedJobCount.value,
    description: '查看错误原因并重试或取消任务',
    path: '/knowledge/index',
    title: '失败任务',
    type: 'error' as const,
  },
  {
    count: parseFailedDocuments.value,
    description: '检查文件格式或重新导入文档',
    path: '/knowledge/documents',
    title: '解析失败文档',
    type: 'error' as const,
  },
  {
    count: reviewingDocuments.value,
    description: '审核内容并决定发布或驳回',
    path: '/knowledge/documents',
    title: '待审核文档',
    type: 'warning' as const,
  },
]);

async function load() {
  if (!activeSpaceId.value) {
    documents.value = [];
    jobs.value = [];
    pointCount.value = 0;
    documentTotal.value = 0;
    processingJobCount.value = 0;
    failedJobCount.value = 0;
    reviewingDocumentCount.value = 0;
    parseFailedDocumentCount.value = 0;
    return;
  }
  loading.value = true;
  try {
    const [
      docs,
      taskPage,
      points,
      reviewing,
      parseFailed,
      pendingJobs,
      runningJobs,
      failedJobsPage,
    ] = await Promise.all([
      getDocuments(activeSpaceId.value, { pageNum: 1, pageSize: 50 }),
      getJobs({ pageNum: 1, pageSize: 20, spaceId: activeSpaceId.value }),
      getKnowledgePoints(activeSpaceId.value, { pageNum: 1, pageSize: 1 }),
      getDocuments(activeSpaceId.value, {
        lifecycleStatus: 'REVIEWING',
        pageNum: 1,
        pageSize: 1,
      }),
      getDocuments(activeSpaceId.value, {
        parseStatus: 'FAILED',
        pageNum: 1,
        pageSize: 1,
      }),
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
    documents.value = docs.items;
    jobs.value = taskPage.items;
    pointCount.value = points.total;
    documentTotal.value = docs.total;
    reviewingDocumentCount.value = reviewing.total;
    parseFailedDocumentCount.value = parseFailed.total;
    processingJobCount.value = pendingJobs.total + runningJobs.total;
    failedJobCount.value = failedJobsPage.total;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await store.loadSpaces();
  await load();
});
</script>

<template>
  <Page
    title="企业知识工作台"
    description="集中查看知识资产健康度、处理进度和优先待办。"
  >
    <KnowledgeSpaceHeader
      :loading="loading"
      show-import
      @refresh="load"
      @import="router.push('/knowledge/documents')"
    />

    <KnowledgeEmptyState
      v-if="!activeSpaceId"
      description="还没有可用的知识空间，请先创建空间。"
      action-text="创建知识空间"
      @action="router.push('/knowledge/spaces')"
    />
    <div v-else class="space-y-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <NCard
          size="small"
          class="cursor-pointer"
          @click="router.push('/knowledge/assets')"
        >
          <NStatistic label="知识点总量" :value="pointCount" />
          <div class="mt-2 text-xs text-muted-foreground">进入知识资产维护</div>
        </NCard>
        <NCard
          size="small"
          class="cursor-pointer"
          @click="router.push('/knowledge/documents')"
        >
          <NStatistic label="文档总量" :value="documentTotal" />
          <div class="mt-2 text-xs text-muted-foreground">
            查看导入和审核状态
          </div>
        </NCard>
        <NCard
          size="small"
          class="cursor-pointer"
          @click="router.push('/knowledge/index')"
        >
          <NStatistic label="处理中任务" :value="processingJobs" />
          <div class="mt-2 text-xs text-muted-foreground">查看任务进度</div>
        </NCard>
        <NCard
          size="small"
          class="cursor-pointer"
          @click="router.push('/knowledge/index')"
        >
          <NStatistic label="异常任务" :value="failedJobCount" />
          <div class="mt-2 text-xs text-error">优先处理失败任务</div>
        </NCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <NCard title="快捷工作流" :bordered="false">
          <div class="grid gap-3 md:grid-cols-3">
            <button
              v-for="item in [
                {
                  title: '补充知识资产',
                  desc: '新增知识点或导入业务文档',
                  path: '/knowledge/assets',
                },
                {
                  title: '整理知识关系',
                  desc: '维护节点方向与关系类型',
                  path: '/knowledge/relations',
                },
                {
                  title: '验证检索效果',
                  desc: '使用真实问题检查召回质量',
                  path: '/knowledge/search',
                },
              ]"
              :key="item.title"
              class="rounded-lg border p-4 text-left transition hover:border-primary hover:shadow-sm"
              @click="router.push(item.path)"
            >
              <div class="font-medium">{{ item.title }}</div>
              <div class="mt-2 text-sm text-muted-foreground">
                {{ item.desc }}
              </div>
              <div class="mt-4 text-sm text-primary">进入处理 →</div>
            </button>
          </div>
        </NCard>

        <NCard title="优先待办" :bordered="false">
          <div class="space-y-3">
            <button
              v-for="item in todos"
              :key="item.title"
              class="flex w-full items-center justify-between rounded-lg border p-3 text-left hover:border-primary"
              @click="router.push(item.path)"
            >
              <div>
                <div class="font-medium">{{ item.title }}</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ item.description }}
                </div>
              </div>
              <NTag :type="item.type" round>{{ item.count }}</NTag>
            </button>
          </div>
        </NCard>
      </div>

      <NCard title="最近任务" :bordered="false">
        <div v-if="jobs.length" class="divide-y">
          <div
            v-for="job in jobs.slice(0, 6)"
            :key="job.id"
            class="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div>
              <b>任务 #{{ job.id }}</b>
              <span class="ml-3 text-sm text-muted-foreground">{{
                getStageLabel(job.stage)
              }}</span>
              <div
                v-if="job.errorMessage"
                class="mt-1 max-w-3xl truncate text-xs text-error"
              >
                {{ job.errorMessage }}
              </div>
            </div>
            <KnowledgeStatusTag :value="job.status" />
          </div>
        </div>
        <KnowledgeEmptyState
          v-else
          description="当前空间暂无处理任务"
          action-text="导入第一份文档"
          @action="router.push('/knowledge/documents')"
        />
        <template #footer>
          <NButton text type="primary" @click="router.push('/knowledge/index')">
            查看全部任务
          </NButton>
        </template>
      </NCard>
    </div>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NSelect, NStatistic, NTag } from 'naive-ui';
import { storeToRefs } from 'pinia';

import {
  getDocuments,
  getJobs,
  type IngestionJob,
  type KnowledgeDocument,
} from '#/api/knowledge/enterprise';
import { getKnowledgePoints } from '#/api/knowledge/point';
import { useKnowledgeStore } from '#/store';

const store = useKnowledgeStore();
const { activeSpaceId, activeSpace, spaceOptions } = storeToRefs(store);
const documents = ref<KnowledgeDocument[]>([]);
const jobs = ref<IngestionJob[]>([]);
const pointCount = ref(0);
const loading = ref(false);
const failedJobs = computed(
  () => jobs.value.filter((item) => item.status === 'FAILED').length,
);
async function load() {
  if (!activeSpaceId.value) return;
  loading.value = true;
  try {
    const [docs, taskPage, points] = await Promise.all([
      getDocuments(activeSpaceId.value, { pageNum: 1, pageSize: 20 }),
      getJobs({ pageNum: 1, pageSize: 20, spaceId: activeSpaceId.value }),
      getKnowledgePoints(activeSpaceId.value, { pageNum: 1, pageSize: 1 }),
    ]);
    documents.value = docs.items;
    jobs.value = taskPage.items;
    pointCount.value = points.total;
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
</script>
<template>
  <Page
    title="企业知识工作台"
    description="以空间为单位查看知识资产健康度、处理进度和待办事项。"
  >
    <div class="space-y-4">
      <NCard
        :bordered="false"
        class="bg-gradient-to-r from-indigo-950 to-slate-900 text-white"
      >
        <div class="flex flex-wrap items-center justify-between gap-6">
          <div>
            <div class="text-sm text-indigo-200">WORKSPACE OVERVIEW</div>
            <div class="mt-2 text-2xl font-semibold">
              {{ activeSpace?.name || '未选择知识空间' }}
            </div>
            <div class="mt-2 text-sm text-slate-300">
              这里是知识团队的日常入口：先看风险，再处理内容，最后验证检索。
            </div>
          </div>
          <NSelect
            v-model:value="activeSpaceId"
            :options="spaceOptions"
            class="w-60"
            placeholder="选择知识空间"
            @update:value="changeSpace"
          />
        </div>
      </NCard>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <NCard size="small"
          >
<NStatistic label="知识点" :value="pointCount" />
</NCard
        ><NCard size="small"
          >
<NStatistic label="近期文档" :value="documents.length" />
</NCard
        ><NCard size="small"
          >
<NStatistic
            label="处理中任务"
            :value="
              jobs.filter(
                (item) =>
                  item.status === 'RUNNING' || item.status === 'PENDING',
              ).length
            " />
</NCard
        ><NCard size="small"
          >
<NStatistic label="异常任务" :value="failedJobs"
        />
</NCard>
      </div>
      <div class="grid gap-4 lg:grid-cols-3">
        <NCard title="工作流入口" class="lg:col-span-2"
          >
<div class="grid gap-3 md:grid-cols-3">
            <div
              v-for="item in [
                { title: '补充知识资产', desc: '新增知识点或批量导入文档' },
                { title: '整理知识关系', desc: '检查孤立节点和关系方向' },
                { title: '验证检索效果', desc: '用真实问题检查召回质量' },
              ]"
              :key="item.title"
              class="rounded-lg border border-slate-200 p-4"
            >
              <div class="font-medium">{{ item.title }}</div>
              <div class="mt-2 text-sm text-slate-500">{{ item.desc }}</div>
              <NButton text type="primary" class="mt-3">进入处理</NButton>
            </div>
          </div>
</NCard
        ><NCard title="空间状态"
          >
<div class="space-y-3 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-500">索引版本</span
              ><b>{{ activeSpace?.activeIndexVersion ?? '-' }}</b>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">分块策略</span
              ><span>{{ activeSpace?.chunkStrategy || '-' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">审核模式</span
              ><NTag size="small" type="info">
{{
                activeSpace?.reviewMode || '-'
              }}
</NTag>
            </div>
          </div>
</NCard
        >
      </div>
      <NCard title="最近任务"
        >
<div v-if="!loading && jobs.length" class="space-y-3">
          <div
            v-for="job in jobs.slice(0, 5)"
            :key="job.id"
            class="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-4 py-3"
          >
            <div>
              <b>任务 #{{ job.id }}</b
              ><span class="ml-3 text-sm text-slate-500">{{ job.stage }}</span>
            </div>
            <NTag
              :type="
                job.status === 'FAILED'
                  ? 'error'
                  : job.status === 'SUCCEEDED'
                    ? 'success'
                    : 'warning'
              "
              >
{{ job.status }}
</NTag
            >
          </div>
        </div>
        <div v-else class="py-8 text-center text-slate-400">
          暂无任务
        </div>
</NCard
      >
    </div>
  </Page>
</template>

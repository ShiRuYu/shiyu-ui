<script lang="ts" setup>
import type { UsageOverview } from '#/api/dashboard/usage';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  WorkbenchHeader,
  WorkbenchProject,
  WorkbenchQuickNav,
  WorkbenchTodo,
  WorkbenchTrends,
} from '@vben/common-ui';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { getModelUsageApi, getUsageOverviewApi } from '#/api/dashboard/usage';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();
const router = useRouter();

const overview = ref<null | UsageOverview>(null);
const loading = ref(true);

const quickNavItems = [
  {
    color: '#2563EB',
    icon: 'carbon:development',
    title: 'Agent 管理',
    url: '/agent/admin/list',
  },
  {
    color: '#059669',
    icon: 'carbon:concept',
    title: '知识库',
    url: '/knowledge/list',
  },
  {
    color: '#D97706',
    icon: 'lucide:book',
    title: '课程学习',
    url: '/learning/course',
  },
  {
    color: '#7C3AED',
    icon: 'lucide:message-circle',
    title: 'AI 对话',
    url: '/ai-tutor/chat',
  },
  {
    color: '#DC2626',
    icon: 'lucide:bar-chart-3',
    title: '数据看板',
    url: '/analytics',
  },
  {
    color: '#0891B2',
    icon: 'carbon:notebook',
    title: '日常记录',
    url: '/record/profile',
  },
];

const todoItems = ref([
  {
    completed: false,
    content: '检查平台 Agent 运行状态，确认所有节点正常运作。',
    title: '平台运行巡检',
    date: new Date().toLocaleDateString('zh-CN'),
  },
  {
    completed: false,
    content: 'Review 近期 API 调用趋势，关注异常波动。',
    title: 'API 用量监控',
    date: new Date().toLocaleDateString('zh-CN'),
  },
  {
    completed: false,
    content: '检查知识库索引状态，确保搜索质量。',
    title: '知识库索引维护',
    date: new Date().toLocaleDateString('zh-CN'),
  },
]);

const modelUsageItems = ref<
  {
    color: string;
    content: string;
    group: string;
    icon: string;
    title: string;
    url: string;
  }[]
>([]);

async function fetchData() {
  loading.value = true;
  try {
    overview.value = await getUsageOverviewApi();
    const modelUsage = await getModelUsageApi();
    modelUsageItems.value = (modelUsage || []).slice(0, 6).map((m) => ({
      title: m.model,
      content: `调用 ${m.call_count} 次 · ${(m.total_tokens / 1000).toFixed(1)}K tokens`,
      group: m.platform,
      icon: 'carbon:ibm-watson-machine-learning',
      color: '#2563EB',
      url: '/agent/model',
    }));
  } catch {
    // 静默失败，使用默认空状态
  } finally {
    loading.value = false;
  }
}

onMounted(fetchData);
</script>

<template>
  <div class="p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
    >
      <template #title> AI 平台工作台 </template>
      <template #description>
        欢迎回来，{{ userStore.userInfo?.realName || '用户' }}
      </template>
    </WorkbenchHeader>

    <!-- 平台概览卡片 -->
    <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">平台数</p>
          <span
            class="h-8 w-8 rounded-md bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
          >
            <span class="i-carbon:bare-metal-server h-full w-full block"></span>
          </span>
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ overview?.platform_count ?? '-' }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">模型数</p>
          <span
            class="h-8 w-8 rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"
          >
            <span
              class="i-carbon:ibm-watson-machine-learning h-full w-full block"
            ></span>
          </span>
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ overview?.model_count ?? '-' }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">总调用次数</p>
          <span
            class="h-8 w-8 rounded-md bg-amber-100 p-1.5 text-amber-600 dark:bg-amber-900 dark:text-amber-300"
          >
            <span class="i-carbon:query-queue h-full w-full block"></span>
          </span>
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ (overview?.total_calls ?? 0).toLocaleString() }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">Token 用量</p>
          <span
            class="h-8 w-8 rounded-md bg-purple-100 p-1.5 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
          >
            <span
              class="i-carbon:data-quality-definition h-full w-full block"
            ></span>
          </span>
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ ((overview?.total_tokens ?? 0) / 1000000).toFixed(1) }}M
        </p>
      </div>
    </div>

    <div class="mt-5 flex flex-col lg:flex-row">
      <div class="mr-4 w-full lg:w-3/5">
        <!-- 模型用量排行 -->
        <WorkbenchProject
          :items="modelUsageItems.length > 0 ? modelUsageItems : undefined"
          :loading="loading"
          title="模型调用排行"
          @click="(item: any) => item.url && router.push(item.url)"
        />
        <WorkbenchTrends class="mt-5" title="系统动态" />
      </div>
      <div class="w-full lg:w-2/5">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="mt-5 lg:mt-0"
          title="快捷导航"
          @click="(item: any) => item.url && router.push(item.url)"
        />
        <WorkbenchTodo :items="todoItems" class="mt-5" title="待办事项" />
        <AnalysisChartCard class="mt-5" title="访问来源">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>

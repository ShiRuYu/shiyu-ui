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
import { $t } from '#/locales';

import AnalyticsVisitsSource from '../analytics/analytics-visits-source.vue';

const userStore = useUserStore();
const router = useRouter();

const overview = ref<null | UsageOverview>(null);
const loading = ref(true);

const quickNavItems = [
  {
    color: '#2563EB',
    icon: 'carbon:development',
    title: $t('dashboard.workbench.agentManagement'),
    url: '/agent/admin/list',
  },
  {
    color: '#059669',
    icon: 'carbon:concept',
    title: $t('dashboard.workbench.knowledgeBase'),
    url: '/knowledge/list',
  },
  {
    color: '#D97706',
    icon: 'lucide:book',
    title: $t('dashboard.workbench.courseLearning'),
    url: '/learning/course',
  },
  {
    color: '#7C3AED',
    icon: 'lucide:message-circle',
    title: $t('dashboard.workbench.aiChat'),
    url: '/workspace/chat',
  },
  {
    color: '#DC2626',
    icon: 'lucide:bar-chart-3',
    title: $t('dashboard.workbench.analytics'),
    url: '/dashboard/analytics',
  },
  {
    color: '#0891B2',
    icon: 'carbon:notebook',
    title: $t('dashboard.workbench.records'),
    url: '/record/profile',
  },
];

const todoItems = ref([
  {
    completed: false,
    content: $t('dashboard.workbench.platformInspectionDescription'),
    title: $t('dashboard.workbench.platformInspection'),
    date: new Date().toLocaleDateString(preferences.app.locale),
  },
  {
    completed: false,
    content: $t('dashboard.workbench.usageMonitoringDescription'),
    title: $t('dashboard.workbench.usageMonitoring'),
    date: new Date().toLocaleDateString(preferences.app.locale),
  },
  {
    completed: false,
    content: $t('dashboard.workbench.indexMaintenanceDescription'),
    title: $t('dashboard.workbench.indexMaintenance'),
    date: new Date().toLocaleDateString(preferences.app.locale),
  },
]);

const modelUsageItems = ref<
  {
    color: string;
    content: string;
    date: string;
    group: string;
    icon: string;
    title: string;
    url: string;
  }[]
>([]);

function formatTokenCount(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString(preferences.app.locale);
}

async function fetchData() {
  loading.value = true;
  try {
    overview.value = await getUsageOverviewApi();
    const modelUsage = await getModelUsageApi();
    modelUsageItems.value = (modelUsage || []).slice(0, 6).map((m) => ({
      title: m.model,
      content: $t('dashboard.workbench.usageSummary', {
        calls: m.call_count.toLocaleString(),
        tokens: formatTokenCount(m.total_tokens),
      }),
      date: '',
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
  <div class="min-w-0 p-3 sm:p-5">
    <WorkbenchHeader
      :avatar="userStore.userInfo?.avatar || preferences.app.defaultAvatar"
      :show-default-actions="false"
    >
      <template #title>{{ $t('dashboard.workbench.title') }}</template>
      <template #description>
        {{
          $t('dashboard.workbench.welcome', {
            name:
              userStore.userInfo?.realName ||
              $t('dashboard.workbench.defaultUser'),
          })
        }}
      </template>
    </WorkbenchHeader>

    <!-- 平台概览卡片 -->
    <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-sm text-muted-foreground">
            {{ $t('dashboard.workbench.platformCount') }}
          </p>
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
          <p class="text-sm text-muted-foreground">
            {{ $t('dashboard.workbench.modelCount') }}
          </p>
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
          <p class="text-sm text-muted-foreground">
            {{ $t('dashboard.workbench.totalCalls') }}
          </p>
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
          <p class="text-sm text-muted-foreground">
            {{ $t('dashboard.workbench.tokenUsage') }}
          </p>
          <span
            class="h-8 w-8 rounded-md bg-purple-100 p-1.5 text-purple-600 dark:bg-purple-900 dark:text-purple-300"
          >
            <span
              class="i-carbon:data-quality-definition h-full w-full block"
            ></span>
          </span>
        </div>
        <p class="mt-2 text-2xl font-bold">
          {{ formatTokenCount(overview?.total_tokens ?? 0) }}
        </p>
      </div>
    </div>

    <div class="mt-5 grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-5">
      <div class="min-w-0 xl:col-span-3">
        <!-- 模型用量排行 -->
        <WorkbenchProject
          :items="modelUsageItems.length > 0 ? modelUsageItems : undefined"
          :loading="loading"
          :title="$t('dashboard.workbench.modelRanking')"
          @click="(item: any) => item.url && router.push(item.url)"
        />
        <WorkbenchTrends
          class="mt-5"
          :title="$t('dashboard.workbench.systemActivity')"
        />
      </div>
      <div class="min-w-0 xl:col-span-2">
        <WorkbenchQuickNav
          :items="quickNavItems"
          class="xl:mt-0"
          :title="$t('dashboard.quickNav')"
          @click="(item: any) => item.url && router.push(item.url)"
        />
        <WorkbenchTodo
          :items="todoItems"
          class="mt-5"
          :title="$t('dashboard.todos')"
        />
        <AnalysisChartCard class="mt-5" :title="$t('dashboard.visitSource')">
          <AnalyticsVisitsSource />
        </AnalysisChartCard>
      </div>
    </div>
  </div>
</template>

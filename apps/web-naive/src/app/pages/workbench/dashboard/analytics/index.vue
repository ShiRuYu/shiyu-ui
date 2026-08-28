<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import { markRaw, onMounted, ref } from 'vue';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';

import { getUsageOverviewApi } from '#/features/governance';
import { $t } from '#/locales';

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisitsData from './analytics-visits-data.vue';
import AnalyticsVisitsSales from './analytics-visits-sales.vue';
import AnalyticsVisitsSource from './analytics-visits-source.vue';
import AnalyticsVisits from './analytics-visits.vue';

const icons = {
  bell: markRaw(SvgBellIcon),
  cake: markRaw(SvgCakeIcon),
  card: markRaw(SvgCardIcon),
  download: markRaw(SvgDownloadIcon),
};

const overviewItems = ref<AnalysisOverviewItem[]>([
  {
    icon: icons.card,
    title: $t('dashboard.users'),
    totalTitle: $t('dashboard.totalUsers'),
    totalValue: 0,
    value: 0,
  },
  {
    icon: icons.cake,
    title: $t('dashboard.visits'),
    totalTitle: '总调用次数',
    totalValue: 0,
    value: 0,
  },
  {
    icon: icons.download,
    title: 'Token 用量',
    totalTitle: '总 Token 数',
    totalValue: 0,
    value: 0,
  },
  {
    icon: icons.bell,
    title: '平均延迟',
    totalTitle: '总花费 ($)',
    totalValue: 0,
    value: 0,
  },
]);

async function fetchData() {
  try {
    const overview = await getUsageOverviewApi();
    if (overview) {
      overviewItems.value = [
        {
          icon: icons.card,
          title: '模型数',
          totalTitle: '平台数',
          totalValue: overview.model_count || 0,
          value: overview.platform_count || 0,
        },
        {
          icon: icons.cake,
          title: '调用次数',
          totalTitle: '总调用次数',
          totalValue: overview.total_calls || 0,
          value: overview.total_calls || 0,
        },
        {
          icon: icons.download,
          title: 'Token 用量',
          totalTitle: '总 Token 数',
          totalValue: overview.total_tokens || 0,
          value: Math.round((overview.total_tokens || 0) / 1000),
        },
        {
          icon: icons.bell,
          title: '平均延迟',
          totalTitle: '总花费 ($)',
          totalValue: Number((overview.total_cost || 0).toFixed(4)),
          value: Math.round(overview.avg_latency_ms || 0),
        },
      ];
    }
  } catch (error) {
    console.warn('获取用量概览失败，使用默认数据', error);
  }
}

onMounted(fetchData);

const chartTabs: TabOption[] = [
  {
    label: $t('dashboard.trafficTrends'),
    value: 'trends',
  },
  {
    label: $t('dashboard.monthlyVisits'),
    value: 'visits',
  },
];
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" />
    <AnalysisChartsTabs :tabs="chartTabs" class="mt-5">
      <template #trends>
        <AnalyticsTrends />
      </template>
      <template #visits>
        <AnalyticsVisits />
      </template>
    </AnalysisChartsTabs>

    <div class="mt-5 w-full md:flex">
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:mr-4 md:w-1/3"
        :title="$t('dashboard.visitCount')"
      >
        <AnalyticsVisitsData />
      </AnalysisChartCard>
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:mr-4 md:w-1/3"
        :title="$t('dashboard.visitSource')"
      >
        <AnalyticsVisitsSource />
      </AnalysisChartCard>
      <AnalysisChartCard
        class="mt-5 md:mt-0 md:w-1/3"
        :title="$t('dashboard.visitSource')"
      >
        <AnalyticsVisitsSales />
      </AnalysisChartCard>
    </div>
  </div>
</template>

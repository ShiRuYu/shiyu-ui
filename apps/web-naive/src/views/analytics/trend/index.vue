<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { NCard, NSpin } from 'naive-ui';

import { getTrend } from '#/api/education/analytics';
import { $t } from '#/locales';

const loading = ref(false);
const trendData = ref<{ dates: string[]; studyRecords: number[]; masteredCount: number[] }>({ dates: [], studyRecords: [], masteredCount: [] });
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

async function loadTrend() {
  loading.value = true;
  try {
    trendData.value = await getTrend(1);
  } catch (error) {
    console.error('Failed to load trend:', error);
  } finally {
    loading.value = false;
  }
}

function updateChart(data: any) {
  if (!data?.dates?.length) return;
  nextTick(() => {
    renderEcharts({
      tooltip: { trigger: 'axis' },
      legend: {
        data: [$t('analytics.studyRecords'), $t('analytics.masteredCount')],
      },
      xAxis: {
        type: 'category',
        data: data.dates,
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: $t('analytics.studyRecords'),
          type: 'line',
          data: data.studyRecords || [],
          smooth: true,
          areaStyle: { opacity: 0.15 },
        },
        {
          name: $t('analytics.masteredCount'),
          type: 'line',
          data: data.masteredCount || [],
          smooth: true,
          areaStyle: { opacity: 0.15 },
        },
      ],
    });
  });
}

watch(trendData, updateChart, { immediate: false });

onMounted(() => {
  loadTrend();
});
</script>

<template>
  <Page :title="$t('analytics.trend')">
    <NCard>
      <NSpin :show="loading">
        <div v-if="trendData?.dates?.length" class="h-[400px] w-full">
          <EchartsUI ref="chartRef" />
        </div>
        <div v-else class="py-20 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

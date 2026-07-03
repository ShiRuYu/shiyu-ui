<script lang="ts" setup>
import type { EducationAnalyticsApi } from '#/api/education/analytics';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NSpin } from 'naive-ui';

import { getTrend } from '#/api';
import { $t } from '#/locales';

const loading = ref(false);
const trendData = ref<EducationAnalyticsApi.TrendResponse>({ dates: [], studyRecords: [], masteredCount: [] });

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

onMounted(() => {
  loadTrend();
});
</script>

<template>
  <Page :title="$t('analytics.trend')">
    <NCard>
      <NSpin :show="loading">
        <div v-if="trendData && trendData.dates && trendData.dates.length" class="py-8">
          <p class="text-center text-lg font-medium mb-4">学习趋势 (近7天)</p>
          <div class="space-y-2">
            <div
              v-for="(date, idx) in trendData.dates"
              :key="date"
              class="flex items-center gap-4"
            >
              <span class="w-24 text-sm text-gray-500">{{ date }}</span>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <div
                    class="h-4 rounded bg-blue-400"
                    :style="{
                      width: `${(trendData.studyRecords[idx] || 0) * 10}%`,
                    }"
                  ></div>
                  <span class="text-sm">{{ trendData.studyRecords[idx] || 0 }} 次学习</span>
                </div>
              </div>
            </div>
          </div>
          <p class="mt-4 text-center text-xs text-gray-400">
            (ECharts Line 图表组件占位)
          </p>
        </div>
        <div v-else class="py-20 text-center text-gray-400">暂无数据</div>
      </NSpin>
    </NCard>
  </Page>
</template>

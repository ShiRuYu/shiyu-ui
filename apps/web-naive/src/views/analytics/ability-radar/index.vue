<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { nextTick, onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { NCard, NSpin } from 'naive-ui';

import { getAbilityRadar } from '#/api/education/analytics';
import { useCurrentStudentId } from '#/composables/useCurrentStudentId';
import { $t } from '#/locales';

const loading = ref(false);
const radarData = ref<any>();
const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const { getCurrentStudentId } = useCurrentStudentId();

async function loadRadar() {
  loading.value = true;
  try {
    radarData.value = await getAbilityRadar(getCurrentStudentId(), 1);
  } catch (error) {
    console.error('Failed to load radar:', error);
  } finally {
    loading.value = false;
  }
}

function updateChart(data: any) {
  if (!data) return;
  nextTick(() => {
    renderEcharts({
      radar: {
        indicator: [
          { name: $t('analytics.remember'), max: 100 },
          { name: $t('analytics.understand'), max: 100 },
          { name: $t('analytics.apply'), max: 100 },
          { name: $t('analytics.analyze'), max: 100 },
          { name: $t('analytics.evaluate'), max: 100 },
          { name: $t('analytics.create'), max: 100 },
        ],
        center: ['50%', '50%'],
        radius: '60%',
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [
                data.remember ?? 0,
                data.understand ?? 0,
                data.apply ?? 0,
                data.analyze ?? 0,
                data.evaluate ?? 0,
                data.create ?? 0,
              ],
              name: $t('analytics.ability'),
              areaStyle: { opacity: 0.2 },
            },
          ],
        },
      ],
      tooltip: { trigger: 'item' },
    });
  });
}

watch(radarData, updateChart, { immediate: false });

onMounted(() => {
  loadRadar();
});
</script>

<template>
  <Page :title="$t('analytics.radar')">
    <NCard>
      <NSpin :show="loading">
        <div v-if="radarData" class="h-[400px] w-full">
          <EchartsUI ref="chartRef" />
        </div>
        <div v-else class="py-20 text-center text-gray-400">
          {{ $t('common.noData') }}
        </div>
      </NSpin>
    </NCard>
  </Page>
</template>

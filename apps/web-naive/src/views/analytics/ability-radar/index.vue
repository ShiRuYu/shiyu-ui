<script lang="ts" setup>
import type { EducationAnalyticsApi } from '#/api/education/analytics';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NSpin } from 'naive-ui';

import { getAbilityRadar } from '#/api';
import { $t } from '#/locales';

const loading = ref(false);
const radarData = ref<EducationAnalyticsApi.AbilityRadarResponse>();

async function loadRadar() {
  loading.value = true;
  try {
    radarData.value = await getAbilityRadar(1, 1);
  } catch (error) {
    console.error('Failed to load radar:', error);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadRadar();
});
</script>

<template>
  <Page :title="$t('analytics.radar')">
    <NCard>
      <NSpin :show="loading">
        <div v-if="radarData" class="flex items-center justify-center py-8">
          <div class="text-center">
            <p class="text-lg font-medium mb-4">Bloom 六维度能力雷达图</p>
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span class="text-gray-500">{{ $t('analytics.remember') }}:</span>
                <span class="ml-1 font-medium">{{ radarData.remember }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ $t('analytics.understand') }}:</span>
                <span class="ml-1 font-medium">{{ radarData.understand }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ $t('analytics.apply') }}:</span>
                <span class="ml-1 font-medium">{{ radarData.apply }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ $t('analytics.analyze') }}:</span>
                <span class="ml-1 font-medium">{{ radarData.analyze }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ $t('analytics.evaluate') }}:</span>
                <span class="ml-1 font-medium">{{ radarData.evaluate }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ $t('analytics.create') }}:</span>
                <span class="ml-1 font-medium">{{ radarData.create }}</span>
              </div>
            </div>
            <p class="mt-4 text-xs text-gray-400">
              (ECharts Radar 图表组件占位)
            </p>
          </div>
        </div>
        <div v-else class="py-20 text-center text-gray-400">暂无数据</div>
      </NSpin>
    </NCard>
  </Page>
</template>

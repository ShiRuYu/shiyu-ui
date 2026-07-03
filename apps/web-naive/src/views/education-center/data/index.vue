<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'lucide:file-bar-chart',
    title: '学习报告',
    description: 'AI生成的综合性学习报告，全面了解学习状况',
    route: '/analytics-center/report',
  },
  {
    icon: 'lucide:radar',
    title: '能力雷达',
    description: 'Bloom六维度能力雷达图，直观展示能力分布',
    route: '/analytics-center/radar',
  },
  {
    icon: 'lucide:trending-up',
    title: '学习趋势',
    description: '学习数据趋势折线图，追踪学习变化',
    route: '/analytics-center/trend',
  },
  {
    icon: 'lucide:alert-triangle',
    title: '薄弱分析',
    description: '薄弱知识点分析与针对性提升建议',
    route: '/analytics-center/weak',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">数据</h2>
      <p class="text-muted-foreground mb-6 text-sm">学习报告、能力分析</p>
      <SubMenuCards :cards="cards" />
    </div>
  </Page>
</template>

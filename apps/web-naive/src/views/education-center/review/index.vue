<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'lucide:calendar-days',
    title: '今日复习',
    description: '基于艾宾浩斯遗忘曲线的今日复习任务',
    route: '/review/today',
  },
  {
    icon: 'lucide:history',
    title: '复习历史',
    description: '查看历史复习记录与完成情况统计',
    route: '/review/history',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">复习</h2>
      <p class="text-muted-foreground mb-6 text-sm">今日复习、复习历史</p>
      <SubMenuCards :cards="cards" :cols="2" />
    </div>
  </Page>
</template>

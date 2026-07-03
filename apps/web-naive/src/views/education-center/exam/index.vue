<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'lucide:file-text',
    title: '在线考试',
    description: '参加各学科在线考试，检验学习成果',
    route: '/exam/list',
  },
  {
    icon: 'lucide:sparkles',
    title: 'AI组卷',
    description: '利用AI技术智能组卷，生成个性化试卷',
    route: '/exam/ai-exam',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">考试</h2>
      <p class="text-muted-foreground mb-6 text-sm">在线考试、AI组卷</p>
      <SubMenuCards :cards="cards" :cols="2" />
    </div>
  </Page>
</template>

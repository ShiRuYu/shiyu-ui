<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'lucide:book',
    title: '课程学习',
    description: '按学科、年级、教材浏览课程，开始系统化学习',
    route: '/learning/course',
  },
  {
    icon: 'lucide:brain',
    title: '知识浏览',
    description: '浏览与搜索知识点，构建知识网络',
    route: '/learning/knowledge',
  },
  {
    icon: 'lucide:calendar-check',
    title: '学习计划',
    description: '制定学习计划与每日任务，跟踪学习进度',
    route: '/learning/plan',
  },
  {
    icon: 'lucide:folder-open',
    title: '学习资源',
    description: '浏览与管理学习资料和资源文件',
    route: '/learning/resource',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">学习</h2>
      <p class="text-muted-foreground mb-6 text-sm">
        课程学习、知识浏览、学习计划、学习资源
      </p>
      <SubMenuCards :cards="cards" />
    </div>
  </Page>
</template>

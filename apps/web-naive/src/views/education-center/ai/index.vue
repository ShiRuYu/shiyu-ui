<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'lucide:graduation-cap',
    title: 'AI讲解',
    description: 'TeacherAgent知识点智能讲解，深入理解学习内容',
    route: '/ai-tutor/teacher',
  },
  {
    icon: 'lucide:pencil-ruler',
    title: 'AI出题',
    description: 'PracticeAgent智能出题，针对薄弱点精准训练',
    route: '/ai-tutor/practice',
  },
  {
    icon: 'lucide:route',
    title: 'AI规划',
    description: 'PlannerAgent学习路径规划，定制个性化学习路线',
    route: '/ai-tutor/planner',
  },
  {
    icon: 'lucide:message-circle',
    title: 'AI对话',
    description: '通用AI对话，随时解答学习疑问',
    route: '/ai-tutor/chat',
  },
  {
    icon: 'lucide:file-output',
    title: 'AI报告',
    description: 'ReportAgent生成详尽的学习分析报告',
    route: '/ai-tutor/report',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">AI助手</h2>
      <p class="text-muted-foreground mb-6 text-sm">AI讲解、AI出题、AI规划、AI对话、AI报告</p>
      <SubMenuCards :cards="cards" />
    </div>
  </Page>
</template>

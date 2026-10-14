<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { NButton, NSpace } from 'naive-ui';

const links = [
  { label: '知识讲解', path: '/education-center/ai-tutor' },
  { label: 'AI 出题', path: '/education-center/ai-tutor/practice' },
  { label: '学习规划', path: '/education-center/ai-tutor/planner' },
  { label: '学习报告', path: '/education-center/ai-tutor/report' },
];
</script>

<template>
  <NSpace class="mb-4" wrap>
    <RouterLink v-for="link in links" :key="link.path" :to="link.path">
      <NButton size="small">{{ link.label }}</NButton>
    </RouterLink>
  </NSpace>
</template>

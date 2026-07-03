<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'lucide:list-checks',
    title: '题库练习',
    description: '按学科、年级、难度刷题练习，巩固所学知识',
    route: '/practice/question',
  },
  {
    icon: 'lucide:x-circle',
    title: '错题本',
    description: '查看历次练习中的错题，针对性巩固薄弱点',
    route: '/practice/wrong',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">练习</h2>
      <p class="text-muted-foreground mb-6 text-sm">题库练习、错题本</p>
      <SubMenuCards :cards="cards" :cols="2" />
    </div>
  </Page>
</template>

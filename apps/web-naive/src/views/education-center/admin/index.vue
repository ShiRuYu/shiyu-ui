<script lang="ts" setup>
import { computed } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import SubMenuCards from '../SubMenuCards.vue';

interface CardItem {
  code: string;
  icon: string;
  title: string;
  description: string;
  route: string;
}

const allCards: CardItem[] = [
  {
    code: 'edu:subject:list',
    icon: 'carbon:book',
    title: '学科管理',
    description: '管理学科分类与配置',
    route: '/edu/subject',
  },
  {
    code: 'edu:textbook:list',
    icon: 'carbon:notebook',
    title: '教材管理',
    description: '管理教材版本与内容',
    route: '/edu/textbook',
  },
  {
    code: 'edu:chapter:list',
    icon: 'carbon:tree',
    title: '章节管理',
    description: '树形管理教材章节结构',
    route: '/edu/chapter',
  },
  {
    code: 'edu:course:list',
    icon: 'carbon:course',
    title: '课程管理',
    description: '管理课程信息与配置',
    route: '/edu/course',
  },
  {
    code: 'edu:exam:list',
    icon: 'carbon:exam',
    title: '考试管理',
    description: '管理试卷与考试安排',
    route: '/edu/exam',
  },
  {
    code: 'edu:question:list',
    icon: 'carbon:list-boxes',
    title: '题库管理',
    description: '管理题目库与分类',
    route: '/edu/question',
  },
  {
    code: 'edu:plan:list',
    icon: 'carbon:task',
    title: '学习计划',
    description: '管理学生学习计划',
    route: '/edu/plan',
  },
  {
    code: 'edu:review:list',
    icon: 'carbon:rotate',
    title: '复习任务',
    description: '管理复习任务与安排',
    route: '/edu/review',
  },
  {
    code: 'edu:analytics',
    icon: 'carbon:chart-radar',
    title: '学情分析',
    description: '学情分析看板数据',
    route: '/edu/analytics',
  },
  {
    code: 'edu:resource:list',
    icon: 'carbon:document',
    title: '资源管理',
    description: '管理教学资源文件',
    route: '/edu/resource',
  },
  {
    code: 'edu:wrong-question',
    icon: 'carbon:error',
    title: '错题管理',
    description: '管理学生错题数据',
    route: '/edu/wrong-question',
  },
  {
    code: 'edu:student:list',
    icon: 'carbon:user-avatar',
    title: '学生管理',
    description: '管理学生信息与账号',
    route: '/edu/student',
  },
];

const accessStore = useAccessStore();

const cards = computed(() =>
  allCards.filter((card) => accessStore.accessCodes.includes(card.code)),
);
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">管理</h2>
      <p class="text-muted-foreground mb-6 text-sm">
        课程体系 / 考试题库 / 学习管理 / 资源管理
      </p>
      <SubMenuCards v-if="cards.length > 0" :cards="cards" :cols="3" />
      <div v-else class="py-20 text-center text-gray-400">暂无管理权限</div>
    </div>
  </Page>
</template>

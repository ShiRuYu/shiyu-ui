<script lang="ts" setup>
import { Page } from '@vben/common-ui';

import SubMenuCards from '../SubMenuCards.vue';

const cards = [
  {
    icon: 'carbon:book',
    title: '学科管理',
    description: '管理学科分类与配置',
    route: '/edu/subject',
  },
  {
    icon: 'carbon:notebook',
    title: '教材管理',
    description: '管理教材版本与内容',
    route: '/edu/textbook',
  },
  {
    icon: 'carbon:tree',
    title: '章节管理',
    description: '树形管理教材章节结构',
    route: '/edu/chapter',
  },
  {
    icon: 'carbon:course',
    title: '课程管理',
    description: '管理课程信息与配置',
    route: '/edu/course',
  },
  {
    icon: 'carbon:exam',
    title: '考试管理',
    description: '管理试卷与考试安排',
    route: '/edu/exam',
  },
  {
    icon: 'carbon:list-boxes',
    title: '题库管理',
    description: '管理题目库与分类',
    route: '/edu/question',
  },
  {
    icon: 'carbon:task',
    title: '学习计划',
    description: '管理学生学习计划',
    route: '/edu/plan',
  },
  {
    icon: 'carbon:rotate',
    title: '复习任务',
    description: '管理复习任务与安排',
    route: '/edu/review',
  },
  {
    icon: 'carbon:chart-radar',
    title: '学情分析',
    description: '学情分析看板数据',
    route: '/edu/analytics',
  },
  {
    icon: 'carbon:document',
    title: '资源管理',
    description: '管理教学资源文件',
    route: '/edu/resource',
  },
  {
    icon: 'carbon:error',
    title: '错题管理',
    description: '管理学生错题数据',
    route: '/edu/wrong-question',
  },
  {
    icon: 'carbon:user-avatar',
    title: '学生管理',
    description: '管理学生信息与账号',
    route: '/edu/student',
  },
];
</script>

<template>
  <Page>
    <div class="p-5">
      <h2 class="mb-4 text-xl font-semibold">管理</h2>
      <p class="text-muted-foreground mb-6 text-sm">
        课程体系 / 考试题库 / 学习管理 / 资源管理
      </p>
      <SubMenuCards :cards="cards" :cols="3" />
    </div>
  </Page>
</template>

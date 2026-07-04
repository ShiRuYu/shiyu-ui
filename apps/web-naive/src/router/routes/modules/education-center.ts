import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:graduation-cap',
      order: 10,
      title: $t('page.educationCenter.title'),
    },
    name: 'EducationCenter',
    path: '/education-center',
    redirect: '/education-center/learning',
    children: [
      // ===== 学习 =====
      {
        name: 'EduLearning',
        path: '/education-center/learning',
        component: () => import('#/views/education-center/learning/index.vue'),
        meta: {
          icon: 'lucide:book-open',
          title: $t('page.educationCenter.learning'),
        },
      },
      // ===== 练习 =====
      {
        name: 'EduPractice',
        path: '/education-center/practice',
        component: () => import('#/views/education-center/practice/index.vue'),
        meta: {
          icon: 'lucide:pen-tool',
          title: $t('page.educationCenter.practice'),
        },
      },
      // ===== 考试 =====
      {
        name: 'EduExam',
        path: '/education-center/exam',
        component: () => import('#/views/education-center/exam/index.vue'),
        meta: {
          icon: 'lucide:clipboard-check',
          title: $t('page.educationCenter.exam'),
        },
      },
      // ===== 复习 =====
      {
        name: 'EduReview',
        path: '/education-center/review',
        component: () => import('#/views/education-center/review/index.vue'),
        meta: {
          icon: 'lucide:repeat',
          title: $t('page.educationCenter.review'),
        },
      },
      // ===== 管理 =====
      {
        name: 'EduAdmin',
        path: '/education-center/admin',
        component: () => import('#/views/education-center/admin/index.vue'),
        meta: {
          icon: 'carbon:education',
          title: $t('page.educationCenter.admin'),
        },
      },
    ],
  },
];

export default routes;

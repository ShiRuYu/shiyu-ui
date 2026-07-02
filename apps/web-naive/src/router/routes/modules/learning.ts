import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:book-open',
      order: 10,
      title: $t('page.learning.title'),
    },
    name: 'Learning',
    path: '/learning',
    children: [
      {
        name: 'LearningCourse',
        path: '/learning/course',
        component: () => import('#/views/learning/course/list.vue'),
        meta: {
          icon: 'lucide:book',
          title: $t('page.learning.course'),
        },
      },
      {
        name: 'LearningCourseDetail',
        path: '/learning/course/:id',
        component: () => import('#/views/learning/course/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.learning.courseDetail'),
        },
      },
      {
        name: 'LearningKnowledge',
        path: '/learning/knowledge',
        component: () => import('#/views/learning/knowledge/list.vue'),
        meta: {
          icon: 'lucide:brain',
          title: $t('page.learning.knowledge'),
        },
      },
      {
        name: 'LearningKnowledgeDetail',
        path: '/learning/knowledge/:id',
        component: () => import('#/views/learning/knowledge/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.learning.knowledgeDetail'),
        },
      },
      {
        name: 'LearningPlan',
        path: '/learning/plan',
        component: () => import('#/views/learning/plan/list.vue'),
        meta: {
          icon: 'lucide:calendar-check',
          title: $t('page.learning.plan'),
        },
      },
      {
        name: 'LearningPlanDetail',
        path: '/learning/plan/:id',
        component: () => import('#/views/learning/plan/detail.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.learning.planDetail'),
        },
      },
      {
        name: 'LearningResource',
        path: '/learning/resource',
        component: () => import('#/views/learning/resource/list.vue'),
        meta: {
          icon: 'lucide:folder-open',
          title: $t('page.learning.resource'),
        },
      },
    ],
  },
];

export default routes;

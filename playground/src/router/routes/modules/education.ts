import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:school-outline',
      order: 9996,
      title: $t('education.title'),
    },
    name: 'Education',
    path: '/education',
    children: [
      {
        path: '/education/study-plan',
        name: 'EducationStudyPlan',
        meta: {
          icon: 'mdi:calendar-check',
          title: $t('education.studyPlan.title'),
        },
        component: () => import('#/views/education/study-plan/list.vue'),
      },
      {
        path: '/education/review-task',
        name: 'EducationReviewTask',
        meta: {
          icon: 'mdi:book-refresh',
          title: $t('education.reviewTask.title'),
        },
        component: () => import('#/views/education/review-task/list.vue'),
      },
      {
        path: '/education/analytics',
        name: 'EducationAnalytics',
        meta: {
          icon: 'mdi:chart-line',
          title: $t('education.analytics.title'),
        },
        component: () => import('#/views/education/analytics/list.vue'),
      },
      {
        path: '/education/resource',
        name: 'EducationResource',
        meta: {
          icon: 'mdi:folder-multiple-outline',
          title: $t('education.resource.title'),
        },
        component: () => import('#/views/education/resource/list.vue'),
      },
      {
        path: '/education/wrong-question',
        name: 'EducationWrongQuestion',
        meta: {
          icon: 'mdi:book-remove',
          title: $t('education.wrongQuestion.title'),
        },
        component: () => import('#/views/education/wrong-question/list.vue'),
      },
    ],
  },
];

export default routes;

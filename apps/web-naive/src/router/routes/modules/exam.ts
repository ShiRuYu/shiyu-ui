import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:clipboard-check',
      order: 30,
      hideInMenu: true,
      title: $t('page.exam.title'),
    },
    name: 'Exam',
    path: '/exam',
    children: [
      {
        name: 'ExamList',
        path: '/exam/list',
        component: () => import('#/views/exam/exam-list/list.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('page.exam.list'),
        },
      },
      {
        name: 'ExamTake',
        path: '/exam/take/:id',
        component: () => import('#/views/exam/exam-list/take.vue'),
        meta: { hideInMenu: true, title: $t('page.exam.take') },
      },
      {
        name: 'ExamResult',
        path: '/exam/result/:id',
        component: () => import('#/views/exam/exam-list/result.vue'),
        meta: { hideInMenu: true, title: $t('page.exam.result') },
      },
      {
        name: 'ExamAiExam',
        path: '/exam/ai-exam',
        component: () => import('#/views/exam/ai-exam/index.vue'),
        meta: {
          icon: 'lucide:sparkles',
          title: $t('page.exam.aiExam'),
        },
      },
    ],
  },
];

export default routes;

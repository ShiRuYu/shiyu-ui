import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:pen-tool',
      order: 20,
      title: $t('page.practice.title'),
    },
    name: 'Practice',
    path: '/practice',
    children: [
      {
        name: 'PracticeQuestion',
        path: '/practice/question',
        component: () => import('#/views/practice/question/list.vue'),
        meta: {
          icon: 'lucide:list-checks',
          title: $t('page.practice.question'),
        },
      },
      {
        name: 'PracticeDoing',
        path: '/practice/question/:id',
        component: () => import('#/views/practice/question/practice.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.practice.doing'),
        },
      },
      {
        name: 'PracticeWrong',
        path: '/practice/wrong',
        component: () => import('#/views/practice/wrong-question/list.vue'),
        meta: {
          icon: 'lucide:x-circle',
          title: $t('page.practice.wrong'),
        },
      },
    ],
  },
];

export default routes;

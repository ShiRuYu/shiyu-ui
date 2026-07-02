import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:repeat',
      order: 40,
      title: $t('page.review.title'),
    },
    name: 'Review',
    path: '/review',
    children: [
      {
        name: 'ReviewToday',
        path: '/review/today',
        component: () => import('#/views/review/today/list.vue'),
        meta: {
          icon: 'lucide:calendar-days',
          title: $t('page.review.today'),
        },
      },
      {
        name: 'ReviewHistory',
        path: '/review/history',
        component: () => import('#/views/review/history/list.vue'),
        meta: {
          icon: 'lucide:history',
          title: $t('page.review.history'),
        },
      },
    ],
  },
];

export default routes;

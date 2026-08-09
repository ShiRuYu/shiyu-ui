import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Dashboard',
    path: '/dashboard',
    redirect: '/dashboard/overview',
    children: [
      {
        name: 'Analytics',
        path: 'analytics',
        alias: '/analytics',
        component: () => import('#/views/dashboard/analytics/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:area-chart',
          title: $t('page.dashboard.analytics'),
        },
      },
      {
        name: 'Overview',
        path: 'overview',
        alias: '/overview',
        component: () => import('#/views/dashboard/overview/index.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: $t('page.dashboard.overview'),
        },
      },
    ],
  },
];

export default routes;

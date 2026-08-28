import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

/**
 * The workbench remains available as a frontend-owned recovery entry in mixed
 * access mode. The permission-sensitive business domains come from the API.
 */
const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:layout-dashboard',
      order: -1,
      title: $t('page.dashboard.title'),
    },
    name: 'Workbench',
    path: '/workbench',
    redirect: '/workbench/overview',
    children: [
      {
        name: 'Overview',
        path: 'overview',
        component: () =>
          import('#/app/pages/workbench/dashboard/overview/index.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: $t('page.dashboard.overview'),
        },
      },
    ],
  },
];

export default routes;

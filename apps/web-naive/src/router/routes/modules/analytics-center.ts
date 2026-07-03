import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bar-chart-3',
      order: 50,
      hideInMenu: true,
      title: $t('page.analyticsCenter.title'),
    },
    name: 'AnalyticsCenter',
    path: '/analytics-center',
    children: [
      {
        name: 'AnalyticsReport',
        path: '/analytics-center/report',
        component: () => import('#/views/analytics/report/index.vue'),
        meta: {
          icon: 'lucide:file-bar-chart',
          title: $t('page.analyticsCenter.report'),
        },
      },
      {
        name: 'AnalyticsRadar',
        path: '/analytics-center/radar',
        component: () => import('#/views/analytics/ability-radar/index.vue'),
        meta: {
          icon: 'lucide:radar',
          title: $t('page.analyticsCenter.radar'),
        },
      },
      {
        name: 'AnalyticsTrend',
        path: '/analytics-center/trend',
        component: () => import('#/views/analytics/trend/index.vue'),
        meta: {
          icon: 'lucide:trending-up',
          title: $t('page.analyticsCenter.trend'),
        },
      },
      {
        name: 'AnalyticsWeak',
        path: '/analytics-center/weak',
        component: () => import('#/views/analytics/weak-points/list.vue'),
        meta: {
          icon: 'lucide:alert-triangle',
          title: $t('page.analyticsCenter.weak'),
        },
      },
    ],
  },
];

export default routes;

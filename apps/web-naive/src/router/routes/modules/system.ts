import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:shield-check',
      order: 9998,
      title: $t('page.system.authCode'),
      hideInMenu: true,
    },
    name: 'SystemAuthCode',
    path: '/system/auth-code',
    component: () => import('#/views/system/auth-code/index.vue'),
  },
];

export default routes;

import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:folder',
      order: 90,
      title: $t('page.file.title'),
    },
    name: 'FileManager',
    path: '/file',
    component: () => import('#/views/file/list.vue'),
  },
];

export default routes;

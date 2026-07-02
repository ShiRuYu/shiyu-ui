import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:network',
      order: 70,
      title: $t('page.knowledge.title'),
    },
    name: 'KnowledgeEngine',
    path: '/knowledge',
    children: [
      {
        name: 'KnowledgeList',
        path: '/knowledge/list',
        component: () =>
          import('#/views/knowledge-engine/knowledge-list/list.vue'),
        meta: { icon: 'lucide:database', title: $t('page.knowledge.list') },
      },
      {
        name: 'KnowledgeGraph',
        path: '/knowledge/graph',
        component: () =>
          import('#/views/knowledge-engine/knowledge-graph/index.vue'),
        meta: { icon: 'lucide:git-branch', title: $t('page.knowledge.graph') },
      },
      {
        name: 'KnowledgeDocument',
        path: '/knowledge/document',
        component: () => import('#/views/knowledge-engine/document/list.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('page.knowledge.document'),
        },
      },
      {
        name: 'KnowledgeIndex',
        path: '/knowledge/index',
        component: () =>
          import('#/views/knowledge-engine/index-rebuild/list.vue'),
        meta: { icon: 'lucide:refresh-cw', title: $t('page.knowledge.index') },
      },
    ],
  },
];

export default routes;

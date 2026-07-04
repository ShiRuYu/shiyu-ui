import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:library',
      order: 70,
      title: $t('page.knowledge.title'),
    },
    name: 'Knowledge',
    path: '/knowledge',
    children: [
      {
        name: 'KnowledgeList',
        path: '/knowledge/list',
        component: () =>
          import('#/views/knowledge-engine/knowledge-list/list.vue'),
        meta: { icon: 'carbon:concept', title: $t('page.knowledge.list') },
      },
      {
        name: 'KnowledgeGraph',
        path: '/knowledge/graph',
        component: () =>
          import('#/views/knowledge-engine/knowledge-graph/index.vue'),
        meta: { icon: 'carbon:network-3', title: $t('page.knowledge.graph') },
      },
      {
        name: 'KnowledgeDocument',
        path: '/knowledge/document',
        component: () => import('#/views/knowledge-engine/document/list.vue'),
        meta: {
          icon: 'carbon:document',
          title: $t('page.knowledge.document'),
        },
      },
      {
        name: 'KnowledgeIndex',
        path: '/knowledge/index',
        component: () =>
          import('#/views/knowledge-engine/index-rebuild/list.vue'),
        meta: { icon: 'carbon:data-class', title: $t('page.knowledge.index') },
      },
      {
        name: 'KnowledgeRelation',
        path: '/knowledge/relation',
        component: () =>
          import('#/views/knowledge-engine/knowledge-relation/index.vue'),
        meta: { icon: 'carbon:flow', title: $t('page.knowledge.relation') },
      },
    ],
  },
];

export default routes;

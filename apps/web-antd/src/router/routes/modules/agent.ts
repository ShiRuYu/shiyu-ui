import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bot',
      order: 10,
      title: $t('page.agent.title'),
    },
    name: 'Agent',
    path: '/agent',
    children: [
      {
        name: 'AgentList',
        path: '',
        component: () => import('#/views/agent/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: $t('page.agent.list'),
        },
      },
      {
        name: 'AgentChat',
        path: ':agentId/chat',
        component: () => import('#/views/agent/chat.vue'),
        meta: {
          hideInMenu: true,
          title: $t('page.agent.chat'),
        },
      },
    ],
  },
];

export default routes;

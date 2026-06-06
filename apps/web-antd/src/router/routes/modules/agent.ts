import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      noBasicLayout: true,
      icon: 'lucide:bot',
      title: $t('page.agent.title'),
    },
    name: 'Agent',
    path: '/agent',
    children: [
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

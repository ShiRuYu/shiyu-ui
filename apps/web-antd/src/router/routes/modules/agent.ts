import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      hideInMenu: true,
      title: $t('page.agent.chat'),
    },
    name: 'AgentChat',
    path: '/agent/:agentId/chat',
    component: () => import('#/views/agent/chat.vue'),
  },
];

export default routes;

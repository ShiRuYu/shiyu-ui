import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:bot',
      order: 60,
      title: $t('page.agent.title'),
    },
    name: 'Agent',
    path: '/agent',
    children: [
      {
        name: 'AgentAdmin',
        path: '/agent/admin/list',
        component: () => import('#/views/agent/admin/agent-list.vue'),
        meta: {
          icon: 'carbon:development',
          title: $t('page.agent.admin'),
        },
      },
      {
        name: 'AgentAdminEdit',
        path: '/agent/admin/edit',
        component: () => import('#/views/agent/admin/agent-edit.vue'),
        meta: {
          icon: 'carbon:settings',
          title: $t('page.agent.adminEdit'),
          hideInMenu: true,
        },
      },
      {
        name: 'AgentPlatform',
        path: '/agent/platform',
        component: () => import('#/views/agent/platform/list.vue'),
        meta: {
          icon: 'carbon:bare-metal-server',
          title: $t('page.agent.platform'),
        },
      },
      {
        name: 'AgentModel',
        path: '/agent/model',
        component: () => import('#/views/agent/model/list.vue'),
        meta: {
          icon: 'carbon:ibm-watson-machine-learning',
          title: $t('page.agent.model'),
        },
      },
      {
        name: 'AgentChatConfig',
        path: '/agent/chat-config',
        component: () => import('#/views/agent/chat-config/index.vue'),
        meta: {
          icon: 'carbon:chat',
          title: $t('page.agent.chatConfig'),
        },
      },
      {
        name: 'AgentIntent',
        path: '/agent/intent',
        component: () => import('#/views/agent/intent/list.vue'),
        meta: {
          icon: 'carbon:task',
          title: $t('page.agent.intent'),
        },
      },
    ],
  },
];

export default routes;

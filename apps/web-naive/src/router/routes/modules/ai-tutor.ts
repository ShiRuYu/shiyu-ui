import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bot',
      order: 60,
      hideInMenu: true,
      title: $t('page.aiTutor.title'),
    },
    name: 'AiTutor',
    path: '/ai-tutor',
    children: [
      {
        name: 'AiTutorTeacher',
        path: '/ai-tutor/teacher',
        component: () => import('#/views/ai-tutor/teacher/index.vue'),
        meta: {
          icon: 'lucide:graduation-cap',
          title: $t('page.aiTutor.teacher'),
        },
      },
      {
        name: 'AiTutorPractice',
        path: '/ai-tutor/practice',
        component: () => import('#/views/ai-tutor/practice/index.vue'),
        meta: {
          icon: 'lucide:pencil-ruler',
          title: $t('page.aiTutor.practice'),
        },
      },
      {
        name: 'AiTutorPlanner',
        path: '/ai-tutor/planner',
        component: () => import('#/views/ai-tutor/planner/index.vue'),
        meta: {
          icon: 'lucide:route',
          title: $t('page.aiTutor.planner'),
        },
      },
      {
        name: 'AiTutorChat',
        path: '/ai-tutor/chat',
        component: () => import('#/views/ai-tutor/chat/index.vue'),
        meta: {
          icon: 'lucide:message-circle',
          title: $t('page.aiTutor.chat'),
        },
      },
      {
        name: 'AiTutorReport',
        path: '/ai-tutor/report',
        component: () => import('#/views/ai-tutor/report-gen/index.vue'),
        meta: {
          icon: 'lucide:file-output',
          title: $t('page.aiTutor.report'),
        },
      },
    ],
  },
];

export default routes;

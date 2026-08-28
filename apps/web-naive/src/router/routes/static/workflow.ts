import type { RouteRecordRaw } from 'vue-router';

/**
 * Non-menu workflow pages. They are reachable from buttons inside a menu page,
 * but must not become duplicate top-level navigation items.
 *
 * The parent names intentionally match backend menu names so mixed access mode
 * merges these children into the permission-filtered menu route tree.
 */
const routes: RouteRecordRaw[] = [
  {
    name: 'AppStudio',
    path: '/app-studio',
    children: [
      {
        name: 'AiAppEdit',
        path: 'apps/edit',
        component: () => import('#/features/agent/pages/app-edit.vue'),
        meta: {
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '编辑 AI App',
        },
      },
      {
        name: 'AgentStudioEdit',
        path: 'agents/edit',
        component: () => import('#/features/agent/pages/admin/agent-edit.vue'),
        meta: {
          hideInBreadcrumb: true,
          hideInMenu: true,
          hideInTab: true,
          title: '编辑 Agent',
        },
      },
    ],
  },
  {
    name: 'EducationWorkspace',
    path: '/education-center',
    children: [
      {
        name: 'EducationPractice',
        path: 'practice',
        children: [
          {
            name: 'EducationExamList',
            path: 'exams',
            component: () =>
              import('#/features/education/pages/student/exams/list.vue'),
            meta: {
              hideInBreadcrumb: true,
              hideInMenu: true,
              hideInTab: true,
              title: '考试列表',
            },
          },
          {
            name: 'EducationExamTake',
            path: 'exams/take/:id',
            component: () =>
              import('#/features/education/pages/student/exams/take.vue'),
            meta: {
              hideInBreadcrumb: true,
              hideInMenu: true,
              hideInTab: true,
              title: '参加考试',
            },
          },
          {
            name: 'EducationExamResult',
            path: 'exams/result/:id',
            component: () =>
              import('#/features/education/pages/student/exams/result.vue'),
            meta: {
              hideInBreadcrumb: true,
              hideInMenu: true,
              hideInTab: true,
              title: '考试结果',
            },
          },
        ],
      },
    ],
  },
];

export default routes;

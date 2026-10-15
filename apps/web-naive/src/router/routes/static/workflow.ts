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
    meta: {
      hideInBreadcrumb: true,
      hideInMenu: true,
      hideInTab: true,
      title: '教育中心',
    },
    children: [
      {
        name: 'EducationLearning',
        path: 'learning',
        children: [
          {
            name: 'EducationCourseDetail',
            path: 'course/:id',
            component: () =>
              import('#/features/education/pages/student/course-detail.vue'),
            meta: {
              hideInBreadcrumb: true,
              hideInMenu: true,
              hideInTab: true,
              title: '课程详情',
            },
          },
        ],
      },
      {
        name: 'EducationPractice',
        path: 'practice',
        children: [
          {
            name: 'EducationQuestionPractice',
            path: 'questions/:id',
            component: () =>
              import('#/features/education/pages/student/question-practice.vue'),
            meta: {
              hideInBreadcrumb: true,
              hideInMenu: true,
              hideInTab: true,
              title: '题目练习',
            },
          },
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
      {
        name: 'EducationTutor',
        path: 'ai-tutor',
        children: [
          {
            name: 'EducationTutorTeacher',
            path: 'teacher',
            component: () =>
              import('#/features/education/pages/tutor/teacher/index.vue'),
            meta: { hideInMenu: true, title: '知识讲解' },
          },
          {
            name: 'EducationTutorPractice',
            path: 'practice',
            component: () =>
              import('#/features/education/pages/tutor/practice/index.vue'),
            meta: { hideInMenu: true, title: 'AI 出题' },
          },
          {
            name: 'EducationTutorPlanner',
            path: 'planner',
            component: () =>
              import('#/features/education/pages/tutor/planner/index.vue'),
            meta: { hideInMenu: true, title: '学习规划' },
          },
          {
            name: 'EducationTutorReport',
            path: 'report',
            component: () =>
              import('#/features/education/pages/tutor/report-gen/index.vue'),
            meta: { hideInMenu: true, title: '学习报告' },
          },
        ],
      },
    ],
  },
];

export default routes;

import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:education',
      order: 80,
      hideInMenu: true,
      title: $t('page.eduAdmin.title'),
    },
    name: 'Education',
    path: '/edu',
    children: [
      {
        name: 'EducationSubject',
        path: '/edu/subject',
        component: () => import('#/views/education-admin/subject/list.vue'),
        meta: { icon: 'carbon:book', title: $t('page.eduAdmin.subject') },
      },
      {
        name: 'EducationTextbook',
        path: '/edu/textbook',
        component: () => import('#/views/education-admin/textbook/list.vue'),
        meta: {
          icon: 'carbon:notebook',
          title: $t('page.eduAdmin.textbook'),
        },
      },
      {
        name: 'EducationChapter',
        path: '/edu/chapter',
        component: () => import('#/views/education-admin/chapter/list.vue'),
        meta: { icon: 'carbon:tree', title: $t('page.eduAdmin.chapter') },
      },
      {
        name: 'EducationCourse',
        path: '/edu/course',
        component: () =>
          import('#/views/education-admin/course-admin/list.vue'),
        meta: {
          icon: 'carbon:course',
          title: $t('page.eduAdmin.course'),
        },
      },
      {
        name: 'EducationQuestion',
        path: '/edu/question',
        component: () =>
          import('#/views/education-admin/question-admin/list.vue'),
        meta: {
          icon: 'carbon:list-boxes',
          title: $t('page.eduAdmin.question'),
        },
      },
      {
        name: 'EducationExam',
        path: '/edu/exam',
        component: () => import('#/views/education-admin/exam-admin/list.vue'),
        meta: {
          icon: 'carbon:exam',
          title: $t('page.eduAdmin.exam'),
        },
      },
      {
        name: 'EducationStudent',
        path: '/edu/student',
        component: () => import('#/views/education-admin/student/list.vue'),
        meta: { icon: 'carbon:user-avatar', title: $t('page.eduAdmin.student') },
      },
      {
        name: 'EducationResource',
        path: '/edu/resource',
        component: () =>
          import('#/views/education-admin/resource-admin/list.vue'),
        meta: { icon: 'carbon:document', title: $t('page.eduAdmin.resource') },
      },
    ],
  },
];

export default routes;

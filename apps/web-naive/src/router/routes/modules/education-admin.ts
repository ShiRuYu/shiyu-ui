import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:school',
      order: 80,
      title: $t('page.eduAdmin.title'),
    },
    name: 'EducationAdmin',
    path: '/edu',
    children: [
      {
        name: 'EduSubject',
        path: '/edu/subject',
        component: () => import('#/views/education-admin/subject/list.vue'),
        meta: { icon: 'lucide:layers', title: $t('page.eduAdmin.subject') },
      },
      {
        name: 'EduTextbook',
        path: '/edu/textbook',
        component: () => import('#/views/education-admin/textbook/list.vue'),
        meta: { icon: 'lucide:book-marked', title: $t('page.eduAdmin.textbook') },
      },
      {
        name: 'EduChapter',
        path: '/edu/chapter',
        component: () => import('#/views/education-admin/chapter/list.vue'),
        meta: { icon: 'lucide:list-tree', title: $t('page.eduAdmin.chapter') },
      },
      {
        name: 'EduCourse',
        path: '/edu/course',
        component: () => import('#/views/education-admin/course-admin/list.vue'),
        meta: { icon: 'lucide:presentation', title: $t('page.eduAdmin.course') },
      },
      {
        name: 'EduQuestion',
        path: '/edu/question',
        component: () => import('#/views/education-admin/question-admin/list.vue'),
        meta: { icon: 'lucide:help-circle', title: $t('page.eduAdmin.question') },
      },
      {
        name: 'EduExam',
        path: '/edu/exam',
        component: () => import('#/views/education-admin/exam-admin/list.vue'),
        meta: { icon: 'lucide:clipboard-list', title: $t('page.eduAdmin.exam') },
      },
      {
        name: 'EduStudent',
        path: '/edu/student',
        component: () => import('#/views/education-admin/student/list.vue'),
        meta: { icon: 'lucide:users', title: $t('page.eduAdmin.student') },
      },
      {
        name: 'EduResource',
        path: '/edu/resource',
        component: () => import('#/views/education-admin/resource-admin/list.vue'),
        meta: { icon: 'lucide:folder', title: $t('page.eduAdmin.resource') },
      },
    ],
  },
];

export default routes;

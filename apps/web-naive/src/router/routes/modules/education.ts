import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'carbon:education',
      order: 6,
      title: '教育管理',
    },
    name: 'Education',
    path: '/education',
    children: [
      {
        name: 'EducationSubject',
        path: '/subject',
        component: () => import('#/views/education/subject/list.vue'),
        meta: {
          icon: 'carbon:book',
          title: '学科管理',
        },
      },
      {
        name: 'EducationTextbook',
        path: '/textbook',
        component: () => import('#/views/education/textbook/list.vue'),
        meta: {
          icon: 'carbon:notebook',
          title: '教材管理',
        },
      },
      {
        name: 'EducationChapter',
        path: '/chapter',
        component: () => import('#/views/education/chapter/list.vue'),
        meta: {
          icon: 'carbon:tree',
          title: '章节管理',
        },
      },
      {
        name: 'EducationCourse',
        path: '/course',
        component: () => import('#/views/education/course/list.vue'),
        meta: {
          icon: 'carbon:course',
          title: '课程管理',
        },
      },
      {
        name: 'EducationExam',
        path: '/exam',
        component: () => import('#/views/education/exam/list.vue'),
        meta: {
          icon: 'carbon:exam-mode',
          title: '试卷管理',
        },
      },
      {
        name: 'EducationQuestion',
        path: '/question',
        component: () => import('#/views/education/question/list.vue'),
        meta: {
          icon: 'carbon:list-boxes',
          title: '题库管理',
        },
      },
    ],
  },
];

export default routes;

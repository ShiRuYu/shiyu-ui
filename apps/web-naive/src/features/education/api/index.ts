export * from './analytics';
export * from './chapter';
export * from './course';
export * from './exam';
export * from './question';
export * from './subject';
export * from './textbook';

export {
  createExam as createAdminExam,
  deleteExam as deleteAdminExam,
  getExamById as getAdminExamById,
  getExamList as getAdminExamList,
  updateExam as updateAdminExam,
} from './exam-admin';
export type { EducationAdminExamApi } from './exam-admin';
export * from './plan';
export * from './resource';
export * from './review';
export * from './student';
export * from './wrong-question';

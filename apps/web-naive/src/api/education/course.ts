import { requestClient } from '#/api/request';

export namespace EducationCourseApi {
  export interface PageData<T> {
    items: T[];
    total: number;
  }

  export interface Course {
    [key: string]: any;
    id: number;
    name: string;
    description: string;
    subjectCode: string;
    grade: number;
    textbookId: number;
    teacherId: number;
    coverUrl: string;
    totalHours: number;
    status: number;
  }
}

async function getCourseList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationCourseApi.PageData<EducationCourseApi.Course>>('/api/course', {
    params: { pageNum, pageSize },
  });
}

async function getCourseById(id: number) {
  return requestClient.get<EducationCourseApi.Course>(`/api/course/${id}`);
}

async function getCourseBySubject(subjectCode: string) {
  return requestClient.get<EducationCourseApi.Course[]>(
    `/api/course/subject/${subjectCode}`,
  );
}

async function getCourseByGrade(grade: number) {
  return requestClient.get<EducationCourseApi.Course[]>(
    `/api/course/grade/${grade}`,
  );
}

async function createCourse(data: Omit<EducationCourseApi.Course, 'id'>) {
  return requestClient.post('/api/course', data);
}

async function updateCourse(
  id: number,
  data: Partial<EducationCourseApi.Course>,
) {
  return requestClient.put(`/api/course/${id}`, data);
}

async function startLearning(courseId: number, studentId: number) {
  return requestClient.post(`/api/course/${courseId}/learn`, null, {
    params: { studentId },
  });
}

async function deleteCourse(id: number) {
  return requestClient.delete(`/api/course/${id}`);
}

export {
  createCourse,
  deleteCourse,
  getCourseByGrade,
  getCourseById,
  getCourseBySubject,
  getCourseList,
  startLearning,
  updateCourse,
};

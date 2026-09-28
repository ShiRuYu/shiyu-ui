import { requestClient } from '#/shared/api/request';

export namespace EducationCourseApi {
  export interface PageResult<T> {
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
  return requestClient.get<
    EducationCourseApi.PageResult<EducationCourseApi.Course>
  >('/api/education/course', {
    params: { pageNum, pageSize },
  });
}

async function getCourseById(id: number) {
  return requestClient.get<EducationCourseApi.Course>(
    `/api/education/course/${id}`,
  );
}

async function getCourseBySubject(subjectCode: string) {
  return requestClient.get<EducationCourseApi.Course[]>(
    '/api/education/course/subject',
    {
      params: { subjectCode },
    },
  );
}

async function getCourseByGrade(grade: number) {
  return requestClient.get<EducationCourseApi.Course[]>(
    '/api/education/course/grade',
    {
      params: { grade },
    },
  );
}

async function createCourse(data: Omit<EducationCourseApi.Course, 'id'>) {
  return requestClient.post('/api/education/course', data);
}

async function updateCourse(
  id: number,
  data: Partial<EducationCourseApi.Course>,
) {
  return requestClient.put(`/api/education/course/${id}`, data);
}

async function startLearning(courseId: number, studentId: number) {
  return requestClient.post('/api/education/course/learn', null, {
    params: { courseId, studentId },
  });
}

async function deleteCourse(id: number) {
  return requestClient.delete(`/api/education/course/${id}`);
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

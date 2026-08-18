import { requestClient } from '#/api/request';

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
  >('/v1/education/course/list', {
    params: { pageNum, pageSize },
  });
}

async function getCourseById(id: number) {
  return requestClient.get<EducationCourseApi.Course>('/v1/education/course/detail', {
    params: { id },
  });
}

async function getCourseBySubject(subjectCode: string) {
  return requestClient.get<EducationCourseApi.Course[]>('/v1/education/course/subject', {
    params: { subjectCode },
  });
}

async function getCourseByGrade(grade: number) {
  return requestClient.get<EducationCourseApi.Course[]>('/v1/education/course/grade', {
    params: { grade },
  });
}

async function createCourse(data: Omit<EducationCourseApi.Course, 'id'>) {
  return requestClient.post('/v1/education/course/create', data);
}

async function updateCourse(
  id: number,
  data: Partial<EducationCourseApi.Course>,
) {
  return requestClient.post('/v1/education/course/update', data, { params: { id } });
}

async function startLearning(courseId: number, studentId: number) {
  return requestClient.post('/v1/education/course/learn', null, {
    params: { courseId, studentId },
  });
}

async function deleteCourse(id: number) {
  return requestClient.post('/v1/education/course/delete', null, { params: { id } });
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

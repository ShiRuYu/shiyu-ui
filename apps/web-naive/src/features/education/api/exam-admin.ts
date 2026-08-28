import { requestClient } from '#/shared/api/request';

export namespace EducationAdminExamApi {
  export interface PageResult<T> {
    items: T[];
    total: number;
  }

  export interface Exam {
    [key: string]: any;
    id: number;
    name: string;
    type: string;
    subjectCode: string;
    grade: number;
    durationMin: number;
    totalScore: number;
    status: number;
    teacherId?: number;
  }
}

async function getExamList(pageNum = 1, pageSize = 10) {
  return requestClient.get<
    EducationAdminExamApi.PageResult<EducationAdminExamApi.Exam>
  >('/api/education/exam/list', { params: { pageNum, pageSize } });
}

async function getExamById(id: number) {
  return requestClient.get<EducationAdminExamApi.Exam>(
    '/api/education/exam/detail',
    {
      params: { id },
    },
  );
}

async function createExam(data: Omit<EducationAdminExamApi.Exam, 'id'>) {
  return requestClient.post('/api/education/exam/create', data);
}

async function updateExam(
  id: number,
  data: Partial<EducationAdminExamApi.Exam>,
) {
  return requestClient.post('/api/education/exam/update', data, {
    params: { id },
  });
}

async function deleteExam(id: number) {
  return requestClient.post('/api/education/exam/delete', null, {
    params: { id },
  });
}

export { createExam, deleteExam, getExamById, getExamList, updateExam };

import { requestClient } from '#/api/request';

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
  >('/edu/exam/list', { params: { pageNum, pageSize } });
}

async function getExamById(id: number) {
  return requestClient.get<EducationAdminExamApi.Exam>('/edu/exam/detail', {
    params: { id },
  });
}

async function createExam(data: Omit<EducationAdminExamApi.Exam, 'id'>) {
  return requestClient.post('/edu/exam/create', data);
}

async function updateExam(
  id: number,
  data: Partial<EducationAdminExamApi.Exam>,
) {
  return requestClient.post('/edu/exam/update', data, { params: { id } });
}

async function deleteExam(id: number) {
  return requestClient.post('/edu/exam/delete', null, { params: { id } });
}

async function publishExam(id: number) {
  return requestClient.post('/edu/exam/publish', null, { params: { id } });
}

async function unpublishExam(id: number) {
  return requestClient.post('/edu/exam/unpublish', null, { params: { id } });
}

export {
  createExam,
  deleteExam,
  getExamById,
  getExamList,
  publishExam,
  unpublishExam,
  updateExam,
};

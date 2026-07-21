import { requestClient } from '#/api/request';

export namespace EducationExamApi {
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
  }
}

async function getExamList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationExamApi.PageResult<EducationExamApi.Exam>>(
    '/edu/exam/list',
    {
      params: { pageNum, pageSize },
    },
  );
}

async function getExamById(id: number) {
  return requestClient.get<EducationExamApi.Exam>('/edu/exam/detail', {
    params: { id },
  });
}

async function getExamBySubject(subjectCode: string) {
  return requestClient.get<EducationExamApi.Exam[]>('/edu/exam/subject', {
    params: { subjectCode },
  });
}

async function getExamByTeacher(teacherId: number) {
  return requestClient.get<EducationExamApi.Exam[]>('/edu/exam/teacher', {
    params: { teacherId },
  });
}

async function createExam(data: Omit<EducationExamApi.Exam, 'id'>) {
  return requestClient.post('/edu/exam/create', data);
}

async function updateExam(id: number, data: Partial<EducationExamApi.Exam>) {
  return requestClient.post('/edu/exam/update', data, { params: { id } });
}

async function deleteExam(id: number) {
  return requestClient.post('/edu/exam/delete', null, { params: { id } });
}

export {
  createExam,
  deleteExam,
  getExamById,
  getExamBySubject,
  getExamByTeacher,
  getExamList,
  updateExam,
};

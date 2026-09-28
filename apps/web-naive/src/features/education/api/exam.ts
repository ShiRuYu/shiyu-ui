import { requestClient } from '#/shared/api/request';

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
    questions?: Question[];
    sections?: Section[];
  }

  export interface Question {
    id: number;
    title?: string;
    name?: string;
    type: string;
    options?: any[];
  }

  export interface Section {
    questions?: Question[];
  }
}

async function getExamList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationExamApi.PageResult<EducationExamApi.Exam>>(
    '/api/education/exam',
    {
      params: { pageNum, pageSize },
    },
  );
}

async function getExamById(id: number) {
  return requestClient.get<EducationExamApi.Exam>(`/api/education/exam/${id}`);
}

async function getExamBySubject(subjectCode: string) {
  return requestClient.get<EducationExamApi.Exam[]>(
    '/api/education/exam/subject',
    {
      params: { subjectCode },
    },
  );
}

async function getExamByTeacher(teacherId: number) {
  return requestClient.get<EducationExamApi.Exam[]>(
    '/api/education/exam/teacher',
    {
      params: { teacherId },
    },
  );
}

async function createExam(data: Omit<EducationExamApi.Exam, 'id'>) {
  return requestClient.post('/api/education/exam', data);
}

async function updateExam(id: number, data: Partial<EducationExamApi.Exam>) {
  return requestClient.put(`/api/education/exam/${id}`, data);
}

async function deleteExam(id: number) {
  return requestClient.delete(`/api/education/exam/${id}`);
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

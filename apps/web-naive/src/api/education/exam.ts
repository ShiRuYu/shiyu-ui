import { requestClient } from '#/api/request';

export namespace EducationExamApi {
  export interface PageData<T> {
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
  export interface SubmitAnswerRequest {
    studentId: number;
    answer: string;
  }
}

async function getExamList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationExamApi.PageData<EducationExamApi.Exam>>('/api/exam', {
    params: { pageNum, pageSize },
  });
}

async function getExamById(id: number) {
  return requestClient.get<EducationExamApi.Exam>(`/api/exam/${id}`);
}

async function getExamBySubject(subjectCode: string) {
  return requestClient.get<EducationExamApi.Exam[]>(
    `/api/exam/subject/${subjectCode}`,
  );
}

async function getExamByTeacher(teacherId: number) {
  return requestClient.get<EducationExamApi.Exam[]>(
    `/api/exam/teacher/${teacherId}`,
  );
}

async function createExam(data: Omit<EducationExamApi.Exam, 'id'>) {
  return requestClient.post('/api/exam', data);
}

async function updateExam(id: number, data: Partial<EducationExamApi.Exam>) {
  return requestClient.put(`/api/exam/${id}`, data);
}

async function submitExam(
  id: number,
  data: EducationExamApi.SubmitAnswerRequest,
) {
  return requestClient.post(`/api/exam/${id}/submit`, data);
}

async function deleteExam(id: number) {
  return requestClient.delete(`/api/exam/${id}`);
}

export {
  createExam,
  deleteExam,
  getExamById,
  getExamBySubject,
  getExamByTeacher,
  getExamList,
  submitExam,
  updateExam,
};

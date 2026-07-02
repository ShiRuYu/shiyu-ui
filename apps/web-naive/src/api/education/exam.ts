import { requestClient } from '#/api/request';

export namespace EducationExamApi {
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

async function getExamById(id: number) {
  return requestClient.get<EducationExamApi.Exam>(`/api/v1/exam/${id}`);
}

async function getExamBySubject(subjectCode: string) {
  return requestClient.get<EducationExamApi.Exam[]>(
    `/api/v1/exam/subject/${subjectCode}`,
  );
}

async function getExamByTeacher(teacherId: number) {
  return requestClient.get<EducationExamApi.Exam[]>(
    `/api/v1/exam/teacher/${teacherId}`,
  );
}

async function createExam(data: Omit<EducationExamApi.Exam, 'id'>) {
  return requestClient.post('/api/v1/exam', data);
}

async function updateExam(id: number, data: Partial<EducationExamApi.Exam>) {
  return requestClient.put(`/api/v1/exam/${id}`, data);
}

async function submitExam(
  id: number,
  data: EducationExamApi.SubmitAnswerRequest,
) {
  return requestClient.post(`/api/v1/exam/${id}/submit`, data);
}

async function deleteExam(id: number) {
  return requestClient.delete(`/api/v1/exam/${id}`);
}

export {
  createExam,
  deleteExam,
  getExamById,
  getExamBySubject,
  getExamByTeacher,
  submitExam,
  updateExam,
};

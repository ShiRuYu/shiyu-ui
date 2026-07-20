import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace WrongQuestionApi {
  export interface WrongQuestion {
    [key: string]: any;
    correctAnswer: string;
    correctTimes: number;
    id: number;
    knowledgeId: number;
    questionId: number;
    questionTitle: string;
    studentAnswer: string;
    studentId: number;
  }
}

async function getWrongQuestionById(id: number) {
  return requestClient.get<WrongQuestionApi.WrongQuestion>(
    `/api/v1/wrong-question/${id}`,
  );
}

async function listByStudentId(studentId: number) {
  return requestClient.get<WrongQuestionApi.WrongQuestion[]>(
    `/api/v1/wrong-question/student/${studentId}`,
  );
}

async function createWrongQuestion(data: Recordable<any>) {
  return requestClient.post<WrongQuestionApi.WrongQuestion>(
    '/api/v1/wrong-question',
    data,
  );
}

async function updateWrongQuestion(id: number, data: Recordable<any>) {
  return requestClient.put(`/api/v1/wrong-question/${id}`, data);
}

async function deleteWrongQuestion(id: number) {
  return requestClient.delete(`/api/v1/wrong-question/${id}`);
}

export {
  createWrongQuestion,
  deleteWrongQuestion,
  getWrongQuestionById,
  listByStudentId,
  updateWrongQuestion,
};

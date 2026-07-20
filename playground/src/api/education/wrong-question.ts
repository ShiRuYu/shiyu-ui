import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace WrongQuestionApi {
  export interface WrongQuestion {
    [key: string]: any;
    id: number;
    studentId: number;
    questionId: number;
    knowledgeId: number;
    questionTitle: string;
    studentAnswer: string;
    correctAnswer: string;
    correctTimes: number;
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

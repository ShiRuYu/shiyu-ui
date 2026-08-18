import { requestClient } from '#/api/request';

export namespace EducationWrongQuestionApi {
  export interface WrongQuestion {
    [key: string]: any;
    id: number;
    studentId: number;
    questionId: number;
    knowledgeId: number;
    studentAnswer: string;
    correctTimes: number;
  }
}

async function getWrongQuestionById(id: number) {
  return requestClient.get<EducationWrongQuestionApi.WrongQuestion>(
    '/v1/education/wrong-question/detail',
    { params: { id } },
  );
}

async function getWrongQuestionsByStudent(studentId: number) {
  return requestClient.get<EducationWrongQuestionApi.WrongQuestion[]>(
    '/v1/education/wrong-question/student',
    { params: { studentId } },
  );
}

async function createWrongQuestion(
  data: Omit<EducationWrongQuestionApi.WrongQuestion, 'id'>,
) {
  return requestClient.post('/v1/education/wrong-question/create', data);
}

async function updateWrongQuestion(
  id: number,
  data: Partial<EducationWrongQuestionApi.WrongQuestion>,
) {
  return requestClient.post('/v1/education/wrong-question/update', data, {
    params: { id },
  });
}

async function deleteWrongQuestion(id: number) {
  return requestClient.post('/v1/education/wrong-question/delete', null, {
    params: { id },
  });
}

export {
  createWrongQuestion,
  deleteWrongQuestion,
  getWrongQuestionById,
  getWrongQuestionsByStudent,
  updateWrongQuestion,
};

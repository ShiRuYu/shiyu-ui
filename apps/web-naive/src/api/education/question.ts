import { requestClient } from '#/api/request';

export namespace EducationQuestionApi {
  export interface PageData<T> {
    items: T[];
    total: number;
  }

  export interface Question {
    [key: string]: any;
    id: number;
    code: string;
    type: string;
    subjectCode: string;
    grade: number;
    difficulty: number;
    abilityDimension: string;
    title: string;
    options: string;
    answer: string;
    analysis: string;
    tags: string;
    usedCount: number;
  }
}

async function getQuestionById(id: number) {
  return requestClient.get<EducationQuestionApi.Question>(
    `/api/question/${id}`,
  );
}


async function getAllQuestions(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationQuestionApi.PageData<EducationQuestionApi.Question>>('/api/question', {
    params: { pageNum, pageSize },
  });
}
async function getQuestionBySubjectGrade(subjectCode: string, grade: number) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    `/api/question/subject/${subjectCode}/grade/${grade}`,
  );
}

async function getQuestionByDifficulty(difficulty: number) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    `/api/question/difficulty/${difficulty}`,
  );
}

async function getQuestionByType(type: string) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    `/api/question/type/${type}`,
  );
}

async function createQuestion(data: Omit<EducationQuestionApi.Question, 'id'>) {
  return requestClient.post('/api/question', data);
}

async function updateQuestion(
  id: number,
  data: Partial<EducationQuestionApi.Question>,
) {
  return requestClient.put(`/api/question/${id}`, data);
}

async function deleteQuestion(id: number) {
  return requestClient.delete(`/api/question/${id}`);
}

export {
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionByDifficulty,
  getQuestionById,
  getQuestionBySubjectGrade,
  getQuestionByType,
  updateQuestion,
};

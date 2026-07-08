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
    '/edu/question/detail', { params: { id } },
  );
}


async function getAllQuestions(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationQuestionApi.PageData<EducationQuestionApi.Question>>('/edu/question/list', {
    params: { pageNum, pageSize },
  });
}
async function getQuestionBySubjectGrade(subjectCode: string, grade: number) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    '/edu/question/subject-grade',
    { params: { subjectCode, grade } },
  );
}

async function getQuestionByDifficulty(difficulty: number) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    '/edu/question/difficulty',
    { params: { difficulty } },
  );
}

async function getQuestionByType(type: string) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    '/edu/question/type',
    { params: { type } },
  );
}

async function createQuestion(data: Omit<EducationQuestionApi.Question, 'id'>) {
  return requestClient.post('/edu/question/create', data);
}

async function updateQuestion(
  id: number,
  data: Partial<EducationQuestionApi.Question>,
) {
  return requestClient.post('/edu/question/update', data, { params: { id } });
}

async function deleteQuestion(id: number) {
  return requestClient.post('/edu/question/delete', null, { params: { id } });
}

async function getQuestionOptions() {
  const result = await getAllQuestions(1, 1000);
  return (result?.items || []).map((q) => ({ id: q.id, title: q.title }));
}

export {
  getAllQuestions,
  createQuestion,
  deleteQuestion,
  getQuestionByDifficulty,
  getQuestionById,
  getQuestionBySubjectGrade,
  getQuestionByType,
  getQuestionOptions,
  updateQuestion,
};

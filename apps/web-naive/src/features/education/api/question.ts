import { requestClient } from '#/shared/api/request';

export namespace EducationQuestionApi {
  /** 题目 */
  export interface Question {
    [key: string]: any;
    id: number;
    code?: string;
    type: string;
    subjectCode: string;
    grade: number;
    difficulty: number;
    abilityDimension?: string;
    title: string;
    options?: string[];
    answer?: string;
    analysis?: string;
    tags?: string;
  }
}

/** 分页获取题目 */
export async function getAllQuestions(pageNum = 1, pageSize = 10) {
  return requestClient.get<{
    items: EducationQuestionApi.Question[];
    total: number;
  }>('/api/education/question/list', {
    params: { pageNum, pageSize },
  });
}

/** 获取题目详情 */
export async function getQuestionById(id: number) {
  return requestClient.get<EducationQuestionApi.Question>(
    '/api/education/question/detail',
    { params: { id } },
  );
}

/** 根据学科和年级获取题目 */
export async function getQuestionBySubjectGrade(
  subjectCode: string,
  grade: number,
) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    '/api/education/question/subject-grade',
    { params: { subjectCode, grade } },
  );
}

/** 根据难度获取题目 */
export async function getQuestionByDifficulty(difficulty: number) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    '/api/education/question/difficulty',
    { params: { difficulty } },
  );
}

/** 根据类型获取题目 */
export async function getQuestionByType(type: string) {
  return requestClient.get<EducationQuestionApi.Question[]>(
    '/api/education/question/type',
    { params: { type } },
  );
}

/** 创建题目 */
export async function createQuestion(
  data: Omit<EducationQuestionApi.Question, 'id'>,
) {
  return requestClient.post('/api/education/question/create', data);
}

/** 更新题目 */
export async function updateQuestion(
  id: number,
  data: Partial<EducationQuestionApi.Question>,
) {
  return requestClient.post('/api/education/question/update', data, {
    params: { id },
  });
}

/** 删除题目 */
export async function deleteQuestion(id: number) {
  return requestClient.post('/api/education/question/delete', null, {
    params: { id },
  });
}

/** 获取题目下拉选项 */
export async function getQuestionOptions() {
  const result = await getAllQuestions(1, 1000);
  return (result?.items || []).map((q: any) => ({ id: q.id, title: q.title }));
}

import { requestClient } from '#/shared/api/request';

export namespace EducationQuestionApi {
  export interface PracticeQuestion {
    id: number;
    title: string;
    type: 'CHOICE';
    subjectCode: string;
    grade: number;
    options: { label: string; value: string }[];
  }

  export interface PracticeCheck {
    questionId: number;
    correct: boolean;
    correctAnswer: string;
    analysis: null | string;
  }
  export interface PracticeSubmission extends PracticeCheck {
    recordId: number;
  }
  export interface WrongPracticeQuestion {
    id: number;
    questionId: number;
    title: string;
    lastAnswer: null | string;
    correctTimes: number;
  }
  /** 题目 */
  export interface Question {
    [key: string]: any;
    id: number;
    code?: string;
    type: string;
    purpose: 'EXAM_PRIVATE' | 'PRACTICE';
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

export async function getPracticeQuestions(
  subjectCode: string,
  grade?: number,
) {
  return requestClient.get<EducationQuestionApi.PracticeQuestion[]>(
    '/api/education/student-learning/questions',
    { params: { subjectCode, ...(grade ? { grade } : {}) } },
  );
}

export async function getPracticeQuestion(id: number) {
  return requestClient.get<EducationQuestionApi.PracticeQuestion>(
    `/api/education/student-learning/questions/${id}`,
  );
}

export async function getWrongPracticeQuestions() {
  return requestClient.get<EducationQuestionApi.WrongPracticeQuestion[]>(
    '/api/education/student-learning/wrong-questions',
  );
}

export async function checkPracticeAnswer(id: number, answer: string) {
  return requestClient.post<EducationQuestionApi.PracticeCheck>(
    `/api/education/student-learning/questions/${id}/check`,
    { answer },
  );
}

export async function submitPracticeAnswer(
  id: number,
  answer: string,
  submissionKey: string,
) {
  return requestClient.post<EducationQuestionApi.PracticeSubmission>(
    `/api/education/student-learning/questions/${id}/submissions`,
    { answer, submissionKey },
  );
}

/** 分页获取题目 */
export async function getAllQuestions(pageNum = 1, pageSize = 10) {
  return requestClient.get<{
    items: EducationQuestionApi.Question[];
    total: number;
  }>('/api/education/question', {
    params: { pageNum, pageSize },
  });
}

/** 获取题目详情 */
export async function getQuestionById(id: number) {
  return requestClient.get<EducationQuestionApi.Question>(
    `/api/education/question/${id}`,
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
  return requestClient.post('/api/education/question', data);
}

/** 更新题目 */
export async function updateQuestion(
  id: number,
  data: Partial<EducationQuestionApi.Question>,
) {
  return requestClient.put(`/api/education/question/${id}`, data);
}

/** 删除题目 */
export async function deleteQuestion(id: number) {
  return requestClient.delete(`/api/education/question/${id}`);
}

/** 获取题目下拉选项 */
export async function getQuestionOptions() {
  const result = await getAllQuestions(1, 1000);
  return (result?.items || []).map((q) => ({ id: q.id, title: q.title }));
}

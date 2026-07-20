import { requestClient } from '#/api/request';

/** 题目详情 */
export function getQuestionDetailApi(id: number) {
  return requestClient.get<any>(`/api/v1/question/${id}`);
}

/** 根据学科和年级获取题目 */
export function getQuestionBySubjectAndGradeApi(
  subjectCode: string,
  grade: number,
) {
  return requestClient.get<any[]>(
    `/api/v1/question/subject/${subjectCode}/grade/${grade}`,
  );
}

/** 根据难度获取题目 */
export function getQuestionByDifficultyApi(difficulty: number) {
  return requestClient.get<any[]>(`/api/v1/question/difficulty/${difficulty}`);
}

/** 根据类型获取题目 */
export function getQuestionByTypeApi(type: string) {
  return requestClient.get<any[]>(`/api/v1/question/type/${type}`);
}

/** 创建题目 */
export function createQuestionApi(data: any) {
  return requestClient.post('/api/v1/question', data);
}

/** 更新题目 */
export function updateQuestionApi(id: number, data: any) {
  return requestClient.put(`/api/v1/question/${id}`, data);
}

/** 删除题目 */
export function deleteQuestionApi(id: number) {
  return requestClient.delete(`/api/v1/question/${id}`);
}

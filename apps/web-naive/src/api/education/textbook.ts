import { requestClient } from '#/api/request';

/** 教材列表 */
export function getTextbookListApi(params?: Recordable) {
  return requestClient.get<any[]>('/api/v1/textbook', { params });
}

/** 教材详情 */
export function getTextbookDetailApi(id: number) {
  return requestClient.get<any>(`/api/v1/textbook/${id}`);
}

/** 根据学科和年级获取教材 */
export function getTextbookBySubjectAndGradeApi(
  subjectCode: string,
  grade: number,
) {
  return requestClient.get<any[]>(
    `/api/v1/textbook/subject/${subjectCode}/grade/${grade}`,
  );
}

/** 创建教材 */
export function createTextbookApi(data: any) {
  return requestClient.post('/api/v1/textbook', data);
}

/** 更新教材 */
export function updateTextbookApi(id: number, data: any) {
  return requestClient.put(`/api/v1/textbook/${id}`, data);
}

/** 删除教材 */
export function deleteTextbookApi(id: number) {
  return requestClient.delete(`/api/v1/textbook/${id}`);
}

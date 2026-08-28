import type { Recordable } from '@vben/types';

import { requestClient } from '#/shared/api/request';

export namespace EducationTextbookApi {
  /** 教材 */
  export interface Textbook {
    [key: string]: any;
    id: number;
    name: string;
    subjectCode: string;
    grade: number;
    publisher?: string;
    isbn?: string;
  }
}

/** 获取教材列表（分页） */
export async function getTextbookList(
  pageNum = 1,
  pageSize = 10,
  params?: Recordable<any>,
) {
  return requestClient.get<{
    items: EducationTextbookApi.Textbook[];
    total: number;
  }>('/api/education/textbook/list', {
    params: { pageNum, pageSize, ...params },
  });
}

/** 获取教材详情 */
export async function getTextbookById(id: number) {
  return requestClient.get<EducationTextbookApi.Textbook>(
    '/api/education/textbook/detail',
    { params: { id } },
  );
}

/** 根据学科和年级获取教材 */
export async function getTextbookBySubjectAndGrade(
  subjectCode: string,
  grade: number,
) {
  return requestClient.get<EducationTextbookApi.Textbook[]>(
    '/api/education/textbook/subject-grade',
    { params: { subjectCode, grade } },
  );
}

/** 创建教材 */
export async function createTextbook(
  data: Omit<EducationTextbookApi.Textbook, 'id'>,
) {
  return requestClient.post('/api/education/textbook/create', data);
}

/** 更新教材 */
export async function updateTextbook(
  id: number,
  data: Partial<EducationTextbookApi.Textbook>,
) {
  return requestClient.post('/api/education/textbook/update', data, {
    params: { id },
  });
}

/** 删除教材 */
export async function deleteTextbook(id: number) {
  return requestClient.post('/api/education/textbook/delete', null, {
    params: { id },
  });
}

/** 获取教材下拉选项 */
export async function getTextbookOptions() {
  const result = await getTextbookList(1, 1000);
  return (result?.items || []).map((t: any) => ({
    id: t.id,
    name: t.name,
  }));
}

// ---- 兼容别名（供旧代码使用 *Api 后缀） ----
export const getTextbookListApi = getTextbookList;
export const getTextbookDetailApi = getTextbookById;
export const getTextbookBySubjectAndGradeApi = getTextbookBySubjectAndGrade;
export const createTextbookApi = createTextbook;
export const updateTextbookApi = updateTextbook;
export const deleteTextbookApi = deleteTextbook;

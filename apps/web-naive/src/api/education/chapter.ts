import { requestClient } from '#/api/request';

/** 章节详情 */
export function getChapterDetailApi(id: number) {
  return requestClient.get<any>(`/api/v1/chapter/${id}`);
}

/** 获取教材所有章节（平铺） */
export function getChapterByTextbookApi(textbookId: number) {
  return requestClient.get<any[]>(`/api/v1/chapter/textbook/${textbookId}`);
}

/** 获取教材章节树 */
export function getChapterTreeApi(textbookId: number) {
  return requestClient.get<any[]>(
    `/api/v1/chapter/textbook/${textbookId}/tree`,
  );
}

/** 创建章节 */
export function createChapterApi(data: any) {
  return requestClient.post('/api/v1/chapter', data);
}

/** 更新章节 */
export function updateChapterApi(id: number, data: any) {
  return requestClient.put(`/api/v1/chapter/${id}`, data);
}

/** 删除章节 */
export function deleteChapterApi(id: number) {
  return requestClient.delete(`/api/v1/chapter/${id}`);
}

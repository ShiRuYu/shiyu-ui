import { requestClient } from '#/api/request';

/** 获取知识点列表 */
export function getKnowledgeListApi(params?: { category?: string }) {
  return requestClient.get<any[]>('/api/v1/knowledge', { params });
}

/** 获取知识图谱 */
export function getKnowledgeGraphApi(knowledgeId: number) {
  return requestClient.get<any>(`/api/v1/knowledge/${knowledgeId}/graph`);
}

/** 删除知识点 */
export function deleteKnowledgeApi(id: number) {
  return requestClient.delete(`/api/v1/knowledge/${id}`);
}

/** 搜索知识点 */
export function searchKnowledgeApi(params: { query: string; category?: string }) {
  return requestClient.get<any[]>('/api/v1/knowledge/search', { params });
}

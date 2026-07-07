import { requestClient } from '#/api/request';
/** 创建知识点 */
export function createKnowledgeApi(data: any) {
  return requestClient.post('/api/knowledge', data);
}

/** 更新知识点 */
export function updateKnowledgeApi(id: number, data: any) {
  return requestClient.put(`/api/knowledge/${id}`, data);
}

/** 获取知识点列表（后端返回 PageData，自动展开 rows） */
export async function getKnowledgeListApi(params?: any) {
  return requestClient.get<any>('/api/knowledge', { params });
}

/** 获取知识图谱 */
export function getKnowledgeGraphApi(knowledgeId: number) {
  return requestClient.get<any>(`/api/knowledge/${knowledgeId}/graph`);
}

/** 获取知识点详情 */
export function getKnowledgeDetailApi(id: number) {
  return requestClient.get<any>(`/api/knowledge/${id}`);
}

/** 获取学习路径 */
export function getKnowledgePathApi(id: number) {
  return requestClient.get<any>(`/api/knowledge/${id}/path`);
}

/** 删除知识点 */
export function deleteKnowledgeApi(id: number) {
  return requestClient.delete(`/api/knowledge/${id}`);
}

/** 搜索知识点 */
export async function searchKnowledgeApi(params: {
  mode?: string;
  query: string;
  topK?: number;
}) {
  const res = await requestClient.get<any>('/api/knowledge/search', { params });
  return res ?? [];
}

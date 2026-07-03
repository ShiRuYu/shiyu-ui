import { requestClient } from '#/api/request';
/** 创建知识点 */
export function createKnowledgeApi(data: any) {
  return requestClient.post('/api/v1/knowledge', data);
}

/** 更新知识点 */
export function updateKnowledgeApi(id: number, data: any) {
  return requestClient.put(`/api/v1/knowledge/${id}`, data);
}


/** 获取知识点列表（后端返回 PageData，自动展开 rows） */
export async function getKnowledgeListApi(params?: any) {
  const res = await requestClient.get<any>('/api/v1/knowledge', { params });
  // 后端 Result<PageData<KnowledgeResponse>>，data 字段是 PageData{rows, total}
  return (res?.items || res) ?? [];
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
export async function searchKnowledgeApi(params: { query: string; topK?: number; mode?: string }) {
  const res = await requestClient.get<any>('/api/v1/knowledge/search', { params });
  return res ?? [];
}

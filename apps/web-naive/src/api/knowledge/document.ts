import { requestClient } from '#/api/request';

/** 文档列表（按知识点） */
export function getDocumentsByKnowledgeApi(knowledgeId: number) {
  return requestClient.get<any[]>(`/api/knowledge/documents/by-knowledge/${knowledgeId}`);
}

/** 文档详情 */
export function getDocumentDetailApi(id: number) {
  return requestClient.get<any>(`/api/knowledge/documents/${id}`);
}

/** 文档搜索 */
export function searchDocumentsApi(params: { keyword: string; topK?: number }) {
  return requestClient.get<any[]>('/api/knowledge/documents', { params });
}

/** 创建文档 */
export function createDocumentApi(data: any) {
  return requestClient.post('/api/knowledge/documents', data);
}

/** 更新文档 */
export function updateDocumentApi(id: number, data: any) {
  return requestClient.put(`/api/knowledge/documents/${id}`, data);
}

/** 删除文档 */
export function deleteDocumentApi(id: number) {
  return requestClient.delete(`/api/knowledge/documents/${id}`);
}

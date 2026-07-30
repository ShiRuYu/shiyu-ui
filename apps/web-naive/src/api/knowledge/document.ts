import { requestClient } from '#/api/request';

/** 文档列表（按知识点） */
export function getDocumentsByKnowledgeApi(knowledgeId: number) {
  return requestClient.get<any[]>('/knowledge/document/knowledge', {
    params: { knowledgeId },
  });
}

/** 文档详情 */
export function getDocumentDetailApi(id: number) {
  return requestClient.get<any>('/knowledge/document/detail', {
    params: { id },
  });
}

/** 文档搜索 */
export function searchDocumentsApi(params: { keyword: string; topK?: number }) {
  return requestClient.get<any[]>('/knowledge/document/list', { params });
}

/** 创建文档 */
export function createDocumentApi(data: any) {
  return requestClient.post('/knowledge/document/create', data);
}

/** 更新文档 */
export function updateDocumentApi(id: number, data: any) {
  return requestClient.post('/knowledge/document/update', data, {
    params: { id },
  });
}

/** 删除文档 */
export function deleteDocumentApi(id: number) {
  return requestClient.post('/knowledge/document/delete', null, {
    params: { id },
  });
}

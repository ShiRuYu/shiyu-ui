import { requestClient } from '#/api/request';

/** 知识点列表 */
export function getKnowledgeListApi(params?: Recordable) {
  return requestClient.get<any[]>('/api/v1/knowledge', { params });
}

/** 知识点详情 */
export function getKnowledgeDetailApi(id: number) {
  return requestClient.get<any>(`/api/v1/knowledge/${id}`);
}

/** 创建知识点 */
export function createKnowledgeApi(data: any) {
  return requestClient.post('/api/v1/knowledge', data);
}

/** 更新知识点 */
export function updateKnowledgeApi(id: number, data: any) {
  return requestClient.put(`/api/v1/knowledge/${id}`, data);
}

/** 删除知识点 */
export function deleteKnowledgeApi(id: number) {
  return requestClient.delete(`/api/v1/knowledge/${id}`);
}

/** 知识图谱 */
export function getKnowledgeGraphApi(id: number) {
  return requestClient.get<any>(`/api/v1/knowledge/${id}/graph`);
}

/** 学习路径 */
export function getKnowledgePathApi(id: number) {
  return requestClient.get<any>(`/api/v1/knowledge/${id}/path`);
}

/** 前置知识点 */
export function getKnowledgePrerequisitesApi(id: number) {
  return requestClient.get<any[]>(`/api/v1/knowledge/${id}/prerequisites`);
}

/** 前置知识点列表 */
export function getKnowledgePrerequisitesListApi(id: number) {
  return requestClient.get<any[]>(`/api/v1/knowledge/${id}/prerequisites-list`);
}

/** 后续知识点列表 */
export function getKnowledgeSubsequentListApi(id: number) {
  return requestClient.get<any[]>(`/api/v1/knowledge/${id}/subsequent-list`);
}

/** 添加知识关系 */
export function addKnowledgeRelationApi(data: { sourceId: number; targetId: number; type: string; weight?: number }) {
  return requestClient.post('/api/v1/knowledge/relation', data);
}

/** 删除知识关系 */
export function deleteKnowledgeRelationApi(sourceId: number, targetId: number, type: string) {
  return requestClient.delete('/api/v1/knowledge/relation', {
    params: { sourceId, targetId, type },
  });
}

/** 重新加载 */
export function reloadKnowledgeApi() {
  return requestClient.post('/api/v1/knowledge/reload');
}

/** 搜索知识点 */
export function searchKnowledgeApi(params: { query: string; topK?: number; mode?: string }) {
  return requestClient.get<any[]>('/api/v1/knowledge/search', { params });
}

/** 搜索模式列表 */
export function getSearchModesApi() {
  return requestClient.get<string[]>('/api/v1/knowledge/search/modes');
}

/** 重建索引 */
export function rebuildKnowledgeIndexApi() {
  return requestClient.post('/api/v1/knowledge/rebuild-index');
}

/** 索引进度 */
export function getRebuildIndexProgressApi(taskId: string) {
  return requestClient.get<any>(`/api/v1/knowledge/rebuild-index/${taskId}`);
}

/** 索引状态 */
export function getRebuildIndexStatusApi() {
  return requestClient.get<any>('/api/v1/knowledge/rebuild-index');
}

/** 删除索引 */
export function deleteKnowledgeIndexApi() {
  return requestClient.delete('/api/v1/knowledge/index');
}

import { requestClient } from '#/api/request';

/** 获取前置知识点列表 */
export function getKnowledgePrerequisitesListApi(knowledgeId: number) {
  return requestClient.get<any[]>(`/api/v1/knowledge/relations/${knowledgeId}/prerequisites`);
}

/** 获取后续知识点列表 */
export function getKnowledgeSubsequentListApi(knowledgeId: number) {
  return requestClient.get<any[]>(`/api/v1/knowledge/relations/${knowledgeId}/subsequent`);
}

/** 添加知识关系 */
export function addKnowledgeRelationApi(data: {
  sourceId: number;
  targetId: number;
  type: string;
  weight?: number;
}) {
  return requestClient.post('/api/v1/knowledge/relations', data);
}

/** 删除知识关系 */
export function deleteKnowledgeRelationApi(sourceId: number, targetId: number, type: string) {
  return requestClient.delete(`/api/v1/knowledge/relations/${sourceId}/${targetId}`, {
    params: { type },
  });
}

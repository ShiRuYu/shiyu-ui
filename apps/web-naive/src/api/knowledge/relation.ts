import { requestClient } from '#/api/request';

/** 获取前置知识点列表 */
export function getKnowledgePrerequisitesListApi(knowledgeId: number) {
  return requestClient.get<any[]>(
    '/knowledge/knowledge/prerequisites-list',
    { params: { id: knowledgeId } },
  );
}

/** 获取后续知识点列表 */
export function getKnowledgeSubsequentListApi(knowledgeId: number) {
  return requestClient.get<any[]>(
    '/knowledge/knowledge/subsequent-list',
    { params: { id: knowledgeId } },
  );
}

/** 添加知识关系 */
export function addKnowledgeRelationApi(data: {
  sourceId: number;
  targetId: number;
  type: string;
  weight?: number;
}) {
  return requestClient.post('/knowledge/knowledge/relation/create', null, {
    params: {
      sourceId: data.sourceId,
      targetId: data.targetId,
      type: data.type,
      weight: data.weight ?? 1.0,
    },
  });
}

/** 删除知识关系 */
export function deleteKnowledgeRelationApi(
  sourceId: number,
  targetId: number,
  type: string,
) {
  return requestClient.post('/knowledge/knowledge/relation/delete', null, {
    params: { sourceId, targetId, type },
  });
}

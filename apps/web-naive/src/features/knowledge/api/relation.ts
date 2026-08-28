import { requestClient } from '#/shared/api/request';

export interface KnowledgeRelation {
  relationType: string;
  source?: {
    code: string;
    id: number;
    name: string;
  };
  sourceId: number;
  target?: {
    code: string;
    id: number;
    name: string;
  };
  targetId: number;
  weight: number;
}

export function getKnowledgeRelations(pointId: number) {
  return requestClient.get<KnowledgeRelation[]>(
    `/api/knowledge/points/${pointId}/relations`,
  );
}

export function createKnowledgeRelation(data: {
  sourceId: number;
  targetId: number;
  type: string;
  weight?: number;
}) {
  return requestClient.post(
    `/api/knowledge/points/${data.sourceId}/relations`,
    data,
  );
}

export function deleteKnowledgeRelation(
  pointId: number,
  targetId: number,
  type: string,
) {
  return requestClient.delete(
    `/api/knowledge/points/${pointId}/relations/${targetId}`,
    { params: { type } },
  );
}

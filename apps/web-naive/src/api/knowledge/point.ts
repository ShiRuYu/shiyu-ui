import { requestClient } from '#/api/request';
import { useKnowledgeStore } from '#/store';

export interface KnowledgePoint {
  category?: string;
  code: string;
  description?: string;
  difficultyLevel?: number;
  id: number;
  name: string;
  spaceId: number;
  tags?: string;
}

export interface KnowledgePointPage {
  items: KnowledgePoint[];
  total: number;
}

export interface KnowledgePointPayload {
  category?: string;
  code: string;
  description?: string;
  difficultyLevel?: number;
  name: string;
  tags?: string;
}

export function getKnowledgePoint(pointId: number) {
  return requestClient.get<KnowledgePoint>(
    `/knowledge/points/${pointId}`,
  );
}

export function getKnowledgePointGraph(pointId: number) {
  return requestClient.get(`/knowledge/points/${pointId}/graph`);
}

export function getKnowledgePointPath(pointId: number) {
  return requestClient.get<number[]>(
    `/knowledge/points/${pointId}/path`,
  );
}

export function getKnowledgePoints(
  spaceId: number,
  params: {
    category?: string;
    keyword?: string;
    pageNum: number;
    pageSize: number;
  },
) {
  return requestClient.get<KnowledgePointPage>(
    `/knowledge/spaces/${spaceId}/points`,
    { params },
  );
}

export function createKnowledgePoint(
  spaceId: number,
  data: KnowledgePointPayload,
) {
  return requestClient.post<KnowledgePoint>(
    `/knowledge/spaces/${spaceId}/points`,
    data,
  );
}

export function updateKnowledgePoint(
  id: number,
  data: {
    category?: string;
    code?: string;
    description?: string;
    difficultyLevel?: number;
    name?: string;
    tags?: string;
  },
) {
  return requestClient.put<KnowledgePoint>(
    `/knowledge/points/${id}`,
    data,
  );
}

export function deleteKnowledgePoint(id: number) {
  return requestClient.delete(`/knowledge/points/${id}`);
}

export async function getKnowledgePointOptions() {
  const store = useKnowledgeStore();
  if (!store.spaces.length) {
    await store.loadSpaces();
  }
  const spaceId = store.activeSpaceId;
  if (!spaceId) return [];
  const result = await getKnowledgePoints(spaceId, {
    pageNum: 1,
    pageSize: 1000,
  });
  return result.items.map((point) => ({
    id: point.id,
    name: `[${point.code}] ${point.name}`,
  }));
}

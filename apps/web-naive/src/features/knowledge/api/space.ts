import type { KnowledgeSpace, PageData } from './enterprise';

import { requestClient } from '#/shared/api/request';

export interface SpacePayload {
  accessMode?: string;
  bindingMode?: string;
  chunkOverlap?: number;
  chunkSize?: number;
  chunkStrategy?: string;
  code: string;
  description?: string;
  domainCode?: string;
  difficultyScaleId?: number;
  embeddingProfile?: string;
  name: string;
  rerankProfile?: string;
  reviewMode?: string;
}
export interface SpaceMember {
  principalType: 'ROLE' | 'USER';
  principalId: number;
  spaceRole: 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';
}
export function getSpace(id: number) {
  return requestClient.get<KnowledgeSpace>(`/api/knowledge/spaces/${id}`);
}

export function getKnowledgeSpaceOptions() {
  return requestClient.get<KnowledgeSpace[]>('/api/knowledge/spaces/options');
}
export function getSpaceMembers(id: number) {
  return requestClient.get<SpaceMember[]>(
    `/api/knowledge/spaces/${id}/members`,
  );
}
export function updateSpace(id: number, data: Partial<SpacePayload>) {
  return requestClient.put<KnowledgeSpace>(`/api/knowledge/spaces/${id}`, data);
}
export function deleteSpace(id: number) {
  return requestClient.delete(`/api/knowledge/spaces/${id}`);
}
export function replaceSpaceMembers(id: number, data: SpaceMember[]) {
  return requestClient.put(`/api/knowledge/spaces/${id}/members`, data);
}
export function ensureDefaultSpace() {
  return requestClient.post<KnowledgeSpace>('/api/knowledge/spaces/default');
}
export type { KnowledgeSpace, PageData };

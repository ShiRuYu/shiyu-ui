import type { KnowledgeSpace, PageData } from './enterprise';

import { requestClient } from '#/api/request';

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
  return requestClient.get<KnowledgeSpace>(`/knowledge/spaces/${id}`);
}

export function getKnowledgeSpaceOptions() {
  return requestClient.get<KnowledgeSpace[]>('/knowledge/spaces/options');
}
export function getSpaceMembers(id: number) {
  return requestClient.get<SpaceMember[]>(`/knowledge/spaces/${id}/members`);
}
export function updateSpace(id: number, data: Partial<SpacePayload>) {
  return requestClient.put<KnowledgeSpace>(`/knowledge/spaces/${id}`, data);
}
export function deleteSpace(id: number) {
  return requestClient.delete(`/knowledge/spaces/${id}`);
}
export function replaceSpaceMembers(id: number, data: SpaceMember[]) {
  return requestClient.put(`/knowledge/spaces/${id}/members`, data);
}
export function ensureDefaultSpace() {
  return requestClient.post<KnowledgeSpace>('/knowledge/spaces/default');
}
export type { KnowledgeSpace, PageData };

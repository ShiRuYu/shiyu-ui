import type { KnowledgeSpace, PageData } from './enterprise';

import { requestClient } from '#/api/request';

export interface SpacePayload {
  accessMode?: string;
  chunkOverlap?: number;
  chunkSize?: number;
  code: string;
  description?: string;
  difficultyScaleId?: number;
  name: string;
  reviewMode?: string;
}
export interface SpaceMember {
  role: 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';
  userId: number;
}
export function getSpace(id: number) {
  return requestClient.get<KnowledgeSpace>(`/knowledge/spaces/${id}`);
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

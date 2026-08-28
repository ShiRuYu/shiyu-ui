import type { KnowledgeDocument } from './enterprise';

import { requestClient } from '#/shared/api/request';

export interface KnowledgeDocumentSummary {
  docType: string;
  id: number;
  lifecycleStatus: string;
  parseStatus: string;
  spaceId: number;
  title: string;
}

export interface DocumentVersion {
  checksum: string;
  content?: string;
  id: number;
  lifecycleStatus: string;
  mimeType: string;
  objectKey: string;
  parseStatus: string;
  title: string;
  versionNo: number;
}

export interface KnowledgeDocumentRelation {
  id: number;
  sourceDocumentId: number;
  targetDocumentId: number;
  relationType:
    | 'DERIVED_FROM'
    | 'DUPLICATE_OF'
    | 'REFERENCES'
    | 'RELATED_TO'
    | 'SUPERSEDES'
    | 'TRANSLATION_OF'
    | string;
  targetTitle?: string;
}

export function getKnowledgeDocumentRelations(documentId: number) {
  return requestClient.get<KnowledgeDocumentRelation[]>(
    `/api/knowledge/documents/${documentId}/relations`,
  );
}

export function replaceKnowledgeDocumentRelations(
  documentId: number,
  relations: Array<{ documentId: number; relationType: string }>,
) {
  return requestClient.put(`/api/knowledge/documents/${documentId}/relations`, {
    relations,
  });
}

export function getKnowledgeDocumentsByPoint(pointId: number) {
  return requestClient.get<KnowledgeDocumentSummary[]>(
    `/api/knowledge/points/${pointId}/documents`,
  );
}
export function getKnowledgePointIdsByDocument(documentId: number) {
  return requestClient.get<number[]>(
    `/api/knowledge/documents/${documentId}/points`,
  );
}
export function replaceKnowledgeDocumentPoints(
  documentId: number,
  pointIds: number[],
  relationType = 'RELATED',
) {
  return requestClient.put(`/api/knowledge/documents/${documentId}/points`, {
    pointIds,
    relationType,
  });
}
export function replaceKnowledgePointDocuments(
  pointId: number,
  documentIds: number[],
  relationType = 'RELATED',
) {
  return requestClient.put(`/api/knowledge/points/${pointId}/documents`, {
    documentIds,
    relationType,
  });
}
export function getDocumentVersions(id: number) {
  return requestClient.get<DocumentVersion[]>(
    `/api/knowledge/documents/${id}/versions`,
  );
}
export function previewDocument(id: number) {
  return requestClient.get<Blob>(`/api/knowledge/documents/${id}/preview`, {
    responseType: 'blob',
  });
}
export function rollbackDocument(id: number, versionId: number) {
  return requestClient.post<KnowledgeDocument>(
    `/api/knowledge/documents/${id}/versions/${versionId}/rollback`,
  );
}
export function rejectDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/api/knowledge/documents/${id}/reject`,
    undefined,
    { params: { comment } },
  );
}
export function submitDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/api/knowledge/documents/${id}/submit`,
    undefined,
    { params: { comment } },
  );
}
export function approveDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/api/knowledge/documents/${id}/approve`,
    undefined,
    { params: { comment } },
  );
}
export function publishDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/api/knowledge/documents/${id}/publish`,
    undefined,
    { params: { comment } },
  );
}

import type { KnowledgeDocument } from './enterprise';

import { requestClient } from '#/api/request';

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

export function getKnowledgeDocumentsByPoint(pointId: number) {
  return requestClient.get<KnowledgeDocumentSummary[]>(
    `/knowledge/points/${pointId}/documents`,
  );
}
export function getKnowledgePointIdsByDocument(documentId: number) {
  return requestClient.get<number[]>(
    `/knowledge/documents/${documentId}/points`,
  );
}
export function replaceKnowledgeDocumentPoints(
  documentId: number,
  pointIds: number[],
  relationType = 'RELATED',
) {
  return requestClient.put(`/knowledge/documents/${documentId}/points`, {
    pointIds,
    relationType,
  });
}
export function replaceKnowledgePointDocuments(
  pointId: number,
  documentIds: number[],
  relationType = 'RELATED',
) {
  return requestClient.put(`/knowledge/points/${pointId}/documents`, {
    documentIds,
    relationType,
  });
}
export function getDocumentVersions(id: number) {
  return requestClient.get<DocumentVersion[]>(
    `/knowledge/documents/${id}/versions`,
  );
}
export function previewDocument(id: number) {
  return requestClient.get<Blob>(`/knowledge/documents/${id}/preview`, {
    responseType: 'blob',
  });
}
export function rollbackDocument(id: number, versionId: number) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/documents/${id}/versions/${versionId}/rollback`,
  );
}
export function rejectDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/documents/${id}/reject`,
    undefined,
    { params: { comment } },
  );
}
export function submitDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/documents/${id}/submit`,
    undefined,
    { params: { comment } },
  );
}
export function approveDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/documents/${id}/approve`,
    undefined,
    { params: { comment } },
  );
}
export function publishDocument(id: number, comment?: string) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/documents/${id}/publish`,
    undefined,
    { params: { comment } },
  );
}

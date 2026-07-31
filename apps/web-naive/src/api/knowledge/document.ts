import { requestClient } from '#/api/request';

export interface KnowledgeDocumentSummary {
  docType: string;
  id: number;
  lifecycleStatus: string;
  parseStatus: string;
  spaceId: number;
  title: string;
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

export function replaceKnowledgePointDocuments(
  pointId: number,
  documentIds: number[],
) {
  return requestClient.put(`/knowledge/points/${pointId}/documents`, {
    documentIds,
  });
}

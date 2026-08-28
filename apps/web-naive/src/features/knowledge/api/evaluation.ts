import { requestClient } from '#/shared/api/request';

export interface KnowledgeEvaluationCase {
  expectedAnswer?: string;
  expectedDocIds?: string;
  id: number;
  question: string;
  spaceId: number;
}

export interface KnowledgeEvaluationPage {
  items: KnowledgeEvaluationCase[];
  total: number;
}

export interface KnowledgeEvaluationRunResult {
  caseCount: number;
  cases: Array<{
    caseId: number;
    citationAccuracy: number;
    expectedDocumentIds: number[];
    question: string;
    recallAtK: number;
    reciprocalRank: number;
    returnedDocumentIds: number[];
  }>;
  citationAccuracy: number;
  mrr: number;
  recallAtK: number;
  spaceId: number;
  topK: number;
}

export function getKnowledgeEvaluations(
  spaceId: number,
  pageNum = 1,
  pageSize = 10,
) {
  return requestClient.get<KnowledgeEvaluationPage>(
    '/api/knowledge/evaluations',
    {
      params: { pageNum, pageSize, spaceId },
    },
  );
}

export function createKnowledgeEvaluation(data: {
  expectedAnswer?: string;
  expectedDocIds?: string;
  question: string;
  spaceId: number;
}) {
  return requestClient.post<KnowledgeEvaluationCase>(
    '/api/knowledge/evaluations',
    data,
  );
}

export function deleteKnowledgeEvaluation(id: number) {
  return requestClient.delete(`/api/knowledge/evaluations/${id}`);
}

export function runKnowledgeEvaluation(spaceId: number, topK = 5) {
  return requestClient.post<KnowledgeEvaluationRunResult>(
    '/api/knowledge/evaluations/run',
    {
      spaceId,
      topK,
    },
  );
}

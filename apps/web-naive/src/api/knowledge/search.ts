import type { HybridHit } from './enterprise';

import { requestClient } from '#/api/request';
export interface SearchResponse {
  hits: HybridHit[];
  mode: string;
  spaceId: number;
}
export function searchKnowledge(data: {
  mode?: string;
  query: string;
  rerank?: boolean;
  spaceId: number;
  threshold?: number;
  topK?: number;
}) {
  return requestClient.post<SearchResponse>('/v1/knowledge/search', data);
}

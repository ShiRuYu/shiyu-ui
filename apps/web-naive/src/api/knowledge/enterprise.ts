import { requestClient } from '#/api/request';

export interface PageData<T> {
  items: T[];
  total: number;
}

export type SpaceRole = 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';
export type LifecycleStatus =
  | 'ARCHIVED'
  | 'DRAFT'
  | 'PUBLISHED'
  | 'REVIEWING';
export type JobStatus =
  | 'CANCELLED'
  | 'FAILED'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED';

export interface KnowledgeSpace {
  accessMode: 'PRIVATE' | 'TENANT';
  activeIndexVersion: number;
  chunkOverlap: number;
  chunkSize: number;
  chunkStrategy: string;
  code: string;
  createTime: string;
  description?: string;
  embeddingProfile: string;
  id: number;
  name: string;
  rerankProfile: string;
  reviewMode: 'DIRECT' | 'OPTIONAL' | 'REQUIRED';
  status: number;
  updateTime: string;
}

export interface KnowledgeDocument {
  checksum: string;
  createTime: string;
  currentVersionId: number;
  docType: string;
  fileSize: number;
  id: number;
  lifecycleStatus: LifecycleStatus;
  mimeType: string;
  objectKey: string;
  parseStatus: 'FAILED' | 'PENDING' | 'READY';
  source: string;
  spaceId: number;
  title: string;
  updateTime: string;
}

export interface IngestionJob {
  attempts: number;
  createTime: string;
  documentId?: number;
  errorMessage?: string;
  finishedTime?: string;
  heartbeatTime?: string;
  id: number;
  jobKey: string;
  jobType: string;
  maxAttempts: number;
  progress: number;
  spaceId: number;
  stage: string;
  startedTime?: string;
  status: JobStatus;
  versionId?: number;
}

export interface HybridHit {
  bm25Score: number;
  chunkId: number;
  content: string;
  documentId: number;
  highlight?: string;
  rerankScore: number;
  rrfScore: number;
  vectorScore: number;
}

export interface EmbeddedRuntimeStatus {
  dataRoot: string;
  database: string;
  singleWriter: boolean;
  totalBytes: number;
  usableBytes: number;
}

export interface BackupResult {
  createdAt: string;
  fileName: string;
  size: number;
}

export function getSpaces(params: {
  keyword?: string;
  pageNum: number;
  pageSize: number;
}) {
  return requestClient.get<PageData<KnowledgeSpace>>('/knowledge/v2/spaces', {
    params,
  });
}

export function createSpace(data: {
  accessMode?: string;
  chunkOverlap?: number;
  chunkSize?: number;
  code: string;
  description?: string;
  name: string;
  reviewMode?: string;
}) {
  return requestClient.post<KnowledgeSpace>('/knowledge/v2/spaces', data);
}

export function getDocuments(
  spaceId: number,
  params: {
    keyword?: string;
    lifecycleStatus?: string;
    pageNum: number;
    pageSize: number;
  },
) {
  return requestClient.get<PageData<KnowledgeDocument>>(
    `/knowledge/v2/spaces/${spaceId}/documents`,
    { params },
  );
}

export function uploadDocument(spaceId: number, file: File) {
  return requestClient.upload<{
    document: KnowledgeDocument;
    duplicate: boolean;
    jobId?: number;
    versionId: number;
  }>(`/knowledge/v2/spaces/${spaceId}/documents`, { file });
}

export function transitionDocument(
  id: number,
  action: 'approve' | 'publish' | 'reject' | 'submit',
) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/v2/documents/${id}/${action}`,
  );
}

export function deleteDocumentV2(id: number) {
  return requestClient.delete(`/knowledge/v2/documents/${id}`);
}

export function getJobs(params: {
  pageNum: number;
  pageSize: number;
  spaceId?: number;
  status?: JobStatus;
}) {
  return requestClient.get<PageData<IngestionJob>>(
    '/knowledge/v2/ingestion-jobs',
    { params },
  );
}

export function retryJob(id: number) {
  return requestClient.post(`/knowledge/v2/ingestion-jobs/${id}/retry`);
}

export function cancelJob(id: number) {
  return requestClient.post(`/knowledge/v2/ingestion-jobs/${id}/cancel`);
}

export function hybridSearch(data: {
  query: string;
  rerank?: boolean;
  spaceId: number;
  topK?: number;
}) {
  return requestClient.post<{ hits: HybridHit[]; mode: string; spaceId: number }>(
    '/knowledge/v2/search',
    data,
  );
}

export function rebuildSpaceIndex(spaceId: number) {
  return requestClient.post<number>('/knowledge/v2/index-jobs/rebuild', {
    spaceId,
  });
}

export function getEmbeddedRuntimeStatus() {
  return requestClient.get<EmbeddedRuntimeStatus>('/knowledge/v2/system/status');
}

export function createEmbeddedBackup() {
  return requestClient.post<BackupResult>('/knowledge/v2/system/backup');
}

export function checkEmbeddedBackup(fileName: string) {
  return requestClient.post<{
    entries: number;
    errors: string[];
    valid: boolean;
  }>('/knowledge/v2/system/restore-check', undefined, {
    params: { fileName },
  });
}

import { requestClient } from '#/api/request';

export interface PageData<T> {
  items: T[];
  total: number;
}

export type SpaceRole = 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';
export type LifecycleStatus = 'ARCHIVED' | 'DRAFT' | 'PUBLISHED' | 'REVIEWING';
export type JobStatus =
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED'
  | 'PENDING'
  | 'RUNNING'
  | 'SUCCEEDED';

export interface KnowledgeSpace {
  accessMode: 'PRIVATE' | 'TENANT';
  bindingMode: 'OPTIONAL' | 'REQUIRED';
  activeIndexVersion: number;
  chunkOverlap: number;
  chunkSize: number;
  chunkStrategy: string;
  code: string;
  createTime: string;
  description?: string;
  difficultyScaleId: number;
  embeddingProfile: string;
  id: number;
  name: string;
  rerankProfile: string;
  reviewMode: 'DIRECT' | 'OPTIONAL' | 'REQUIRED';
  status: number;
  updateTime: string;
}

export interface KnowledgeDifficultyScaleLevel {
  description?: string;
  label: string;
  level: number;
}

export interface KnowledgeDifficultyScale {
  code: string;
  description?: string;
  id: number;
  levelCount: number;
  levels: KnowledgeDifficultyScaleLevel[];
  name: string;
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

export interface KnowledgeAuditLog {
  action: string;
  createTime: string;
  detailJson?: string;
  id: number;
  resourceId?: number;
  resourceType: string;
  spaceId: number;
}

export function getSpaces(params: {
  keyword?: string;
  pageNum: number;
  pageSize: number;
}) {
  return requestClient.get<PageData<KnowledgeSpace>>('/knowledge/spaces', {
    params,
  });
}

export function createSpace(data: {
  accessMode?: string;
  bindingMode?: string;
  chunkOverlap?: number;
  chunkSize?: number;
  chunkStrategy?: string;
  code: string;
  description?: string;
  difficultyScaleId?: number;
  embeddingProfile?: string;
  name: string;
  rerankProfile?: string;
  reviewMode?: string;
}) {
  return requestClient.post<KnowledgeSpace>('/knowledge/spaces', data);
}

export function getDifficultyScale(spaceId: number) {
  return requestClient.get<KnowledgeDifficultyScale>(
    `/knowledge/spaces/${spaceId}/difficulty-scale`,
  );
}

export function getDocuments(
  spaceId: number,
  params: {
    keyword?: string;
    lifecycleStatus?: string;
    pageNum: number;
    pageSize: number;
    parseStatus?: string;
  },
) {
  return requestClient.get<PageData<KnowledgeDocument>>(
    `/knowledge/spaces/${spaceId}/documents`,
    { params },
  );
}

export function getKnowledgeDocument(id: number) {
  return requestClient.get<KnowledgeDocument>(`/knowledge/documents/${id}`);
}

export function uploadDocument(
  spaceId: number,
  file: File,
  onProgress?: (percent: number) => void,
) {
  if (file.size > 10 * 1024 * 1024) {
    return uploadDocumentResumable(spaceId, file, onProgress);
  }
  return uploadDocumentDirect(spaceId, file, onProgress);
}

function uploadDocumentDirect(
  spaceId: number,
  file: File,
  onProgress?: (percent: number) => void,
) {
  return requestClient.upload<{
    document: KnowledgeDocument;
    duplicate: boolean;
    jobId?: number;
    versionId: number;
  }>(
    `/knowledge/spaces/${spaceId}/documents`,
    { file },
    {
      onUploadProgress: (event) => {
        if (event.total)
          onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    },
  );
}

export interface ResumableUploadSession {
  chunkSize: number;
  fileName: string;
  sessionId: string;
  size: number;
  spaceId: number;
  totalChunks: number;
  uploadedChunks: number[];
}

export function beginResumableUpload(
  spaceId: number,
  data: {
    contentType?: string;
    fileName: string;
    size: number;
    title?: string;
  },
) {
  return requestClient.post<ResumableUploadSession>(
    `/knowledge/spaces/${spaceId}/documents/upload-sessions`,
    data,
  );
}

export function getResumableUploadSession(sessionId: string) {
  return requestClient.get<ResumableUploadSession>(
    `/knowledge/documents/upload-sessions/${sessionId}`,
  );
}

export function uploadResumableChunk(
  sessionId: string,
  index: number,
  totalChunks: number,
  chunk: Blob,
) {
  return requestClient.upload<ResumableUploadSession>(
    `/knowledge/documents/upload-sessions/${sessionId}/chunks/${index}?totalChunks=${totalChunks}`,
    { file: chunk },
  );
}

export function completeResumableUpload(sessionId: string) {
  return requestClient.post<{
    document: KnowledgeDocument;
    duplicate: boolean;
    jobId?: number;
    versionId: number;
  }>(`/knowledge/documents/upload-sessions/${sessionId}/complete`);
}

export function cancelResumableUpload(sessionId: string) {
  return requestClient.delete(
    `/knowledge/documents/upload-sessions/${sessionId}`,
  );
}

export async function uploadDocumentResumable(
  spaceId: number,
  file: File,
  onProgress?: (percent: number) => void,
) {
  const session = await beginResumableUpload(spaceId, {
    contentType: file.type,
    fileName: file.name,
    size: file.size,
  });
  const uploaded = new Set(session.uploadedChunks);
  for (let index = 0; index < session.totalChunks; index++) {
    if (!uploaded.has(index)) {
      const start = index * session.chunkSize;
      const chunk = file.slice(
        start,
        Math.min(start + session.chunkSize, file.size),
      );
      await uploadResumableChunk(
        session.sessionId,
        index,
        session.totalChunks,
        chunk,
      );
    }
    onProgress?.(Math.round(((index + 1) / session.totalChunks) * 100));
  }
  return completeResumableUpload(session.sessionId);
}

export function importDocumentFromUrl(
  spaceId: number,
  url: string,
  title?: string,
) {
  return requestClient.post<{
    document: KnowledgeDocument;
    duplicate: boolean;
    jobId?: number;
    versionId: number;
  }>(`/knowledge/spaces/${spaceId}/documents/import-url`, { url, title });
}

export function transitionDocument(
  id: number,
  action: 'approve' | 'archive' | 'publish' | 'reject' | 'submit',
) {
  return requestClient.post<KnowledgeDocument>(
    `/knowledge/documents/${id}/${action}`,
  );
}

export function deleteDocument(id: number) {
  return requestClient.delete(`/knowledge/documents/${id}`);
}

export function getJobs(params: {
  pageNum: number;
  pageSize: number;
  spaceId?: number;
  status?: JobStatus;
}) {
  return requestClient.get<PageData<IngestionJob>>(
    '/knowledge/ingestion-jobs',
    { params },
  );
}

export function retryJob(id: number) {
  return requestClient.post(`/knowledge/ingestion-jobs/${id}/retry`);
}

export function cancelJob(id: number) {
  return requestClient.post(`/knowledge/ingestion-jobs/${id}/cancel`);
}

export function hybridSearch(data: {
  query: string;
  rerank?: boolean;
  spaceId: number;
  topK?: number;
}) {
  return requestClient.post<{
    hits: HybridHit[];
    mode: string;
    spaceId: number;
  }>('/knowledge/search', data);
}

export function rebuildSpaceIndex(spaceId: number) {
  return requestClient.post<number>('/knowledge/index-jobs/rebuild', {
    spaceId,
  });
}

export function getEmbeddedRuntimeStatus() {
  return requestClient.get<EmbeddedRuntimeStatus>('/knowledge/system/status');
}

export function getKnowledgeAudits(params: {
  pageNum: number;
  pageSize: number;
  spaceId?: number;
}) {
  return requestClient.get<PageData<KnowledgeAuditLog>>('/knowledge/audits', {
    params,
  });
}

export function createEmbeddedBackup() {
  return requestClient.post<BackupResult>('/knowledge/system/backup');
}

export function checkEmbeddedBackup(fileName: string) {
  return requestClient.post<{
    entries: number;
    errors: string[];
    valid: boolean;
  }>('/knowledge/system/restore-check', undefined, {
    params: { fileName },
  });
}

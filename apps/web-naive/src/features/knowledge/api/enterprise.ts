import { requestClient } from '#/shared/api/request';

export interface PageData<T> {
  items: T[];
  total: number;
}

export type SpaceRole = 'ADMIN' | 'EDITOR' | 'REVIEWER' | 'VIEWER';
export type KnowledgeDomainCode =
  | 'EDUCATION'
  | 'ENTERPRISE'
  | 'GENERAL'
  | (string & {});

export const knowledgeDomainLabels: Record<string, string> = {
  EDUCATION: '教育',
  ENTERPRISE: '企业',
  GENERAL: '通用',
};

export function getKnowledgeDomainLabel(domainCode?: string) {
  return domainCode ? knowledgeDomainLabels[domainCode] || domainCode : '通用';
}
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
  domainCode: KnowledgeDomainCode;
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
  domainCode?: KnowledgeDomainCode;
  keyword?: string;
  pageNum: number;
  pageSize: number;
}) {
  return requestClient.get<PageData<KnowledgeSpace>>('/api/knowledge/spaces', {
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
  domainCode?: KnowledgeDomainCode;
  embeddingProfile?: string;
  name: string;
  rerankProfile?: string;
  reviewMode?: string;
}) {
  return requestClient.post<KnowledgeSpace>('/api/knowledge/spaces', data);
}

export function getDifficultyScale(spaceId: number) {
  return requestClient.get<KnowledgeDifficultyScale>(
    `/api/knowledge/spaces/${spaceId}/difficulty-scale`,
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
    `/api/knowledge/spaces/${spaceId}/documents`,
    { params },
  );
}

export function getKnowledgeDocument(id: number) {
  return requestClient.get<KnowledgeDocument>(`/api/knowledge/documents/${id}`);
}

export function uploadDocument(
  spaceId: number,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
) {
  if (file.size > 10 * 1024 * 1024) {
    return uploadDocumentResumable(spaceId, file, onProgress, signal);
  }
  return uploadDocumentDirect(spaceId, file, onProgress, signal);
}

async function uploadDocumentDirect(
  spaceId: number,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
) {
  try {
    return await requestClient.upload<{
      document: KnowledgeDocument;
      duplicate: boolean;
      jobId?: number;
      versionId: number;
    }>(
      `/api/knowledge/spaces/${spaceId}/documents`,
      { file },
      {
        ...(signal ? { signal } : {}),
        onUploadProgress: (event) => {
          if (event.total)
            onProgress?.(Math.round((event.loaded / event.total) * 100));
        },
      },
    );
  } catch (error) {
    if (signal?.aborted) {
      throw new DOMException('Upload cancelled', 'AbortError');
    }
    throw error;
  }
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

function uploadSessionKey(spaceId: number, file: File) {
  return `knowledge:document-upload:${JSON.stringify([
    spaceId,
    file.name,
    file.size,
    file.lastModified,
    file.type,
  ])}`;
}

function savedUploadSession(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveUploadSession(key: string, sessionId: string) {
  try {
    localStorage.setItem(key, sessionId);
  } catch {
    // A blocked or full browser store still permits this upload to finish.
  }
}

function forgetUploadSession(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage access may be blocked by the browser.
  }
}

function matchesUploadSession(
  session: ResumableUploadSession,
  spaceId: number,
  file: File,
  sessionId?: string,
) {
  return (
    !!session &&
    typeof session.sessionId === 'string' &&
    session.sessionId.length > 0 &&
    (!sessionId || session.sessionId === sessionId) &&
    session.spaceId === spaceId &&
    session.fileName === file.name &&
    session.size === file.size &&
    Number.isSafeInteger(session.chunkSize) &&
    session.chunkSize > 0 &&
    session.totalChunks === Math.ceil(file.size / session.chunkSize) &&
    Array.isArray(session.uploadedChunks) &&
    session.uploadedChunks.every(
      (index) =>
        Number.isSafeInteger(index) &&
        index >= 0 &&
        index < session.totalChunks,
    )
  );
}

function uploadSessionUnavailable(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const response = error as {
    code?: number;
    message?: string;
    response?: { status?: number };
    status?: number;
  };
  const status = response.status ?? response.response?.status ?? response.code;
  return (
    status === 403 ||
    status === 404 ||
    status === 410 ||
    /上传会话不存在|无权访问该上传会话/.test(response.message ?? '')
  );
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
    `/api/knowledge/spaces/${spaceId}/documents/upload-sessions`,
    data,
  );
}

export function getResumableUploadSession(sessionId: string) {
  return requestClient.get<ResumableUploadSession>(
    `/api/knowledge/documents/upload-sessions/${sessionId}`,
  );
}

export function uploadResumableChunk(
  sessionId: string,
  index: number,
  totalChunks: number,
  chunk: Blob,
  signal?: AbortSignal,
) {
  return requestClient.upload<ResumableUploadSession>(
    `/api/knowledge/documents/upload-sessions/${sessionId}/chunks/${index}?totalChunks=${totalChunks}`,
    { file: chunk },
    ...(signal ? [{ signal }] : []),
  );
}

export function completeResumableUpload(sessionId: string) {
  return requestClient.post<{
    document: KnowledgeDocument;
    duplicate: boolean;
    jobId?: number;
    versionId: number;
  }>(`/api/knowledge/documents/upload-sessions/${sessionId}/complete`);
}

export function cancelResumableUpload(sessionId: string) {
  return requestClient.delete(
    `/api/knowledge/documents/upload-sessions/${sessionId}`,
  );
}

export async function uploadDocumentResumable(
  spaceId: number,
  file: File,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
) {
  const key = uploadSessionKey(spaceId, file);
  let session: ResumableUploadSession | undefined;
  try {
    signal?.throwIfAborted();
    const previousId = savedUploadSession(key);
    if (previousId) {
      try {
        const previous = await getResumableUploadSession(previousId);
        if (matchesUploadSession(previous, spaceId, file, previousId)) {
          session = previous;
        } else {
          forgetUploadSession(key);
        }
      } catch (error) {
        if (!uploadSessionUnavailable(error)) throw error;
        forgetUploadSession(key);
      }
    }
    if (!session) {
      session = await beginResumableUpload(spaceId, {
        contentType: file.type,
        fileName: file.name,
        size: file.size,
      });
      if (!matchesUploadSession(session, spaceId, file)) {
        throw new Error('上传会话与所选文件不匹配');
      }
      saveUploadSession(key, session.sessionId);
    }
    signal?.throwIfAborted();
    const uploaded = new Set(session.uploadedChunks);
    for (let index = 0; index < session.totalChunks; index++) {
      signal?.throwIfAborted();
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
          signal,
        );
      }
      onProgress?.(
        Math.min(98, Math.round(((index + 1) / session.totalChunks) * 100)),
      );
    }
    signal?.throwIfAborted();
    onProgress?.(99);
    const result = await completeResumableUpload(session.sessionId);
    forgetUploadSession(key);
    return result;
  } catch (error) {
    if (signal?.aborted) {
      const sessionId = session?.sessionId ?? savedUploadSession(key);
      if (sessionId) {
        await cancelResumableUpload(sessionId);
        forgetUploadSession(key);
      }
      throw new DOMException('Upload cancelled', 'AbortError');
    }
    throw error;
  }
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
  }>(`/api/knowledge/spaces/${spaceId}/documents/import-url`, { url, title });
}

export function transitionDocument(
  id: number,
  action: 'approve' | 'archive' | 'publish' | 'reject' | 'submit',
) {
  return requestClient.post<KnowledgeDocument>(
    `/api/knowledge/documents/${id}/${action}`,
  );
}

export function deleteDocument(id: number) {
  return requestClient.delete(`/api/knowledge/documents/${id}`);
}

export function getJobs(params: {
  pageNum: number;
  pageSize: number;
  spaceId?: number;
  status?: JobStatus;
}) {
  return requestClient.get<PageData<IngestionJob>>(
    '/api/knowledge/ingestion-jobs',
    { params },
  );
}

export function retryJob(id: number) {
  return requestClient.post(`/api/knowledge/ingestion-jobs/${id}/retry`);
}

export function cancelJob(id: number) {
  return requestClient.post(`/api/knowledge/ingestion-jobs/${id}/cancel`);
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
  }>('/api/knowledge/search', data);
}

export function rebuildSpaceIndex(spaceId: number) {
  return requestClient.post<number>('/api/knowledge/index-jobs/rebuild', {
    spaceId,
  });
}

export function getEmbeddedRuntimeStatus() {
  return requestClient.get<EmbeddedRuntimeStatus>(
    '/api/knowledge/system/status',
  );
}

export function getKnowledgeAudits(params: {
  pageNum: number;
  pageSize: number;
  spaceId?: number;
}) {
  return requestClient.get<PageData<KnowledgeAuditLog>>(
    '/api/knowledge/audits',
    {
      params,
    },
  );
}

export function createEmbeddedBackup() {
  return requestClient.post<BackupResult>('/api/knowledge/system/backup');
}

export function checkEmbeddedBackup(fileName: string) {
  return requestClient.post<{
    entries: number;
    errors: string[];
    valid: boolean;
  }>('/api/knowledge/system/restore-check', undefined, {
    params: { fileName },
  });
}

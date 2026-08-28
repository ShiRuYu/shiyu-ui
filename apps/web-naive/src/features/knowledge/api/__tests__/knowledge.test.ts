import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  upload: vi.fn(),
}));
const knowledgeStoreMock = vi.hoisted(() => ({
  activeSpaceId: null as number | null,
  loadSpaces: vi.fn(),
  spaces: [] as Array<{ domainCode: string }>,
}));

vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));
vi.mock('#/store', () => ({ useKnowledgeStore: () => knowledgeStoreMock }));

import * as documentApi from '../document';
import * as enterpriseApi from '../enterprise';
import * as evaluationApi from '../evaluation';
import * as pointApi from '../point';
import * as relationApi from '../relation';
import * as searchApi from '../search';
import * as spaceApi from '../space';

import {
  createKnowledgeEvaluation,
  createSpace,
  getKnowledgeDomainLabel,
  getKnowledgeEvaluations,
  getKnowledgeSpaceOptions,
  getSpaces,
  runKnowledgeEvaluation,
  searchKnowledge,
  uploadDocument,
} from '../index';

describe('knowledge feature transport facades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    knowledgeStoreMock.activeSpaceId = null;
    knowledgeStoreMock.spaces = [];
    requestMock.get.mockResolvedValue({ data: [] });
    requestMock.post.mockResolvedValue({ data: { ok: true } });
    requestMock.put.mockResolvedValue({ data: { ok: true } });
    requestMock.delete.mockResolvedValue({ data: { ok: true } });
    requestMock.upload.mockResolvedValue({ data: { ok: true } });
  });

  it('maps space, evaluation and search commands to /api/knowledge', async () => {
    await getSpaces({ pageNum: 1, pageSize: 20, domainCode: 'EDUCATION' });
    await createSpace({ code: 'edu', name: 'Education' });
    await getKnowledgeSpaceOptions();
    await getKnowledgeEvaluations(7, 2, 5);
    await createKnowledgeEvaluation({ spaceId: 7, question: 'q' });
    await runKnowledgeEvaluation(7, 3);
    await searchKnowledge({ spaceId: 7, query: 'graph', topK: 8 });

    expect(requestMock.get).toHaveBeenNthCalledWith(
      1,
      '/api/knowledge/spaces',
      {
        params: { pageNum: 1, pageSize: 20, domainCode: 'EDUCATION' },
      },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/knowledge/spaces',
      {
        code: 'edu',
        name: 'Education',
      },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      3,
      '/api/knowledge/evaluations',
      { params: { pageNum: 2, pageSize: 5, spaceId: 7 } },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      3,
      '/api/knowledge/evaluations/run',
      { spaceId: 7, topK: 3 },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      4,
      '/api/knowledge/search',
      { spaceId: 7, query: 'graph', topK: 8 },
    );
  });

  it('selects direct and resumable upload paths by file size', async () => {
    const small = new File(['small'], 'small.txt', { type: 'text/plain' });
    await uploadDocument(3, small, vi.fn());
    expect(requestMock.upload).toHaveBeenCalledWith(
      '/api/knowledge/spaces/3/documents',
      { file: small },
      expect.objectContaining({ onUploadProgress: expect.any(Function) }),
    );

    requestMock.post
      .mockResolvedValueOnce({
        sessionId: 'session-1',
        chunkSize: 4,
        totalChunks: 1,
        uploadedChunks: [],
      })
      .mockResolvedValueOnce({ document: { id: 1 } });
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.bin');
    await uploadDocument(3, large, vi.fn());
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/knowledge/spaces/3/documents/upload-sessions',
      expect.objectContaining({ fileName: 'large.bin' }),
    );
    expect(requestMock.upload).toHaveBeenCalledWith(
      '/api/knowledge/documents/upload-sessions/session-1/chunks/0?totalChunks=1',
      { file: expect.any(Blob) },
    );
  });

  it('returns stable labels for known, unknown and missing domains', () => {
    expect(getKnowledgeDomainLabel('EDUCATION')).toBe('教育');
    expect(getKnowledgeDomainLabel('CUSTOM')).toBe('CUSTOM');
    expect(getKnowledgeDomainLabel()).toBe('通用');
  });

  it('covers document, point, relation, space and ingestion facades explicitly', async () => {
    const payload = {} as any;
    const file = new File(['content'], 'knowledge.txt', { type: 'text/plain' });

    await documentApi.getKnowledgeDocumentRelations(1);
    await documentApi.replaceKnowledgeDocumentRelations(1, []);
    await documentApi.getKnowledgeDocumentsByPoint(2);
    await documentApi.getKnowledgePointIdsByDocument(1);
    await documentApi.replaceKnowledgeDocumentPoints(1, [2]);
    await documentApi.replaceKnowledgePointDocuments(2, [1]);
    await documentApi.getDocumentVersions(1);
    await documentApi.previewDocument(1);
    await documentApi.rollbackDocument(1, 2);
    await documentApi.rejectDocument(1, 'needs changes');
    await documentApi.submitDocument(1);
    await documentApi.approveDocument(1);
    await documentApi.publishDocument(1);

    await pointApi.getKnowledgePoint(1);
    await pointApi.getKnowledgePointGraph(1);
    await pointApi.getKnowledgePointPath(1);
    await pointApi.findKnowledgePointPath(1, 2);
    await pointApi.getKnowledgePoints(3, { pageNum: 1, pageSize: 10 });
    await pointApi.createKnowledgePoint(3, payload);
    await pointApi.updateKnowledgePoint(1, payload);
    await pointApi.deleteKnowledgePoint(1);
    await expect(pointApi.getKnowledgePointOptions()).resolves.toEqual([]);
    knowledgeStoreMock.spaces = [{ domainCode: 'GENERAL' }];
    knowledgeStoreMock.activeSpaceId = 3;
    requestMock.get.mockResolvedValueOnce({
      items: [{ id: 7, code: 'K7', name: 'Point 7' }],
    });
    await expect(
      pointApi.getKnowledgePointOptions('EDUCATION'),
    ).resolves.toEqual([{ id: 7, name: '[K7] Point 7' }]);

    await relationApi.getKnowledgeRelations(1);
    await relationApi.createKnowledgeRelation({
      sourceId: 1,
      targetId: 2,
      type: 'PREREQUISITE',
    });
    await relationApi.deleteKnowledgeRelation(1, 2, 'PREREQUISITE');

    await spaceApi.getSpace(3);
    await spaceApi.getKnowledgeSpaceOptions();
    await spaceApi.getSpaceMembers(3);
    await spaceApi.updateSpace(3, payload);
    await spaceApi.deleteSpace(3);
    await spaceApi.replaceSpaceMembers(3, []);
    await spaceApi.ensureDefaultSpace();

    await evaluationApi.getKnowledgeEvaluations(3, 1, 10);
    await evaluationApi.createKnowledgeEvaluation({
      spaceId: 3,
      question: 'q',
    });
    await evaluationApi.deleteKnowledgeEvaluation(1);
    await evaluationApi.runKnowledgeEvaluation(3);
    await searchApi.searchKnowledge({ spaceId: 3, query: 'q' });

    await enterpriseApi.getSpaces({ pageNum: 1, pageSize: 10 });
    await enterpriseApi.createSpace({ code: 'demo', name: 'Demo' });
    await enterpriseApi.getDifficultyScale(3);
    await enterpriseApi.getDocuments(3, { pageNum: 1, pageSize: 10 });
    await enterpriseApi.getKnowledgeDocument(1);
    await enterpriseApi.beginResumableUpload(3, {
      fileName: file.name,
      size: file.size,
    });
    await enterpriseApi.getResumableUploadSession('session-1');
    await enterpriseApi.uploadResumableChunk('session-1', 0, 1, file);
    await enterpriseApi.completeResumableUpload('session-1');
    await enterpriseApi.cancelResumableUpload('session-1');
    await enterpriseApi.importDocumentFromUrl(
      3,
      'https://example.test/doc',
      'Doc',
    );
    await enterpriseApi.transitionDocument(1, 'publish');
    await enterpriseApi.deleteDocument(1);
    await enterpriseApi.getJobs({ pageNum: 1, pageSize: 10, spaceId: 3 });
    await enterpriseApi.retryJob(1);
    await enterpriseApi.cancelJob(1);
    await enterpriseApi.hybridSearch({ spaceId: 3, query: 'q' });
    await enterpriseApi.rebuildSpaceIndex(3);
    await enterpriseApi.getEmbeddedRuntimeStatus();
    await enterpriseApi.getKnowledgeAudits({ pageNum: 1, pageSize: 10 });
    await enterpriseApi.createEmbeddedBackup();
    await enterpriseApi.checkEmbeddedBackup('backup.zip');

    expect(requestMock.get).toHaveBeenCalled();
    expect(requestMock.post).toHaveBeenCalled();
    expect(requestMock.put).toHaveBeenCalled();
    expect(requestMock.delete).toHaveBeenCalled();
  });
});

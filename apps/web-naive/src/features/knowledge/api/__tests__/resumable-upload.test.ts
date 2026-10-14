import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  upload: vi.fn(),
}));

vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import { uploadDocument, uploadDocumentResumable } from '../enterprise';

describe('knowledge document resumable upload', () => {
  const file = new File(['abcdefgh'], 'resume.bin', {
    lastModified: 1_700_000_000_000,
    type: 'application/octet-stream',
  });
  const session = {
    chunkSize: 4,
    fileName: file.name,
    sessionId: 'session-1',
    size: file.size,
    spaceId: 3,
    totalChunks: 2,
    uploadedChunks: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    requestMock.post.mockImplementation(async (url: string) =>
      url.endsWith('/complete') ? { document: { id: 1 } } : session,
    );
    requestMock.upload.mockResolvedValue(session);
    requestMock.delete.mockResolvedValue(undefined);
  });

  it('resumes an interrupted file using server status and sends only missing chunks', async () => {
    let failSecondChunk = true;
    requestMock.upload.mockImplementation(async (url: string) => {
      if (url.includes('/chunks/1') && failSecondChunk) {
        failSecondChunk = false;
        throw new Error('connection interrupted');
      }
      return session;
    });

    await expect(uploadDocumentResumable(3, file)).rejects.toThrow(
      'connection interrupted',
    );
    requestMock.get.mockResolvedValue({ ...session, uploadedChunks: [0] });

    await expect(uploadDocumentResumable(3, file)).resolves.toEqual({
      document: { id: 1 },
    });
    expect(requestMock.post).toHaveBeenCalledTimes(2); // begin once, complete once
    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/knowledge/documents/upload-sessions/session-1',
    );
    expect(requestMock.upload.mock.calls.map(([url]) => url)).toEqual([
      '/api/knowledge/documents/upload-sessions/session-1/chunks/0?totalChunks=2',
      '/api/knowledge/documents/upload-sessions/session-1/chunks/1?totalChunks=2',
      '/api/knowledge/documents/upload-sessions/session-1/chunks/1?totalChunks=2',
    ]);
  });

  it('starts a new session when the saved session does not match the selected file', async () => {
    requestMock.upload.mockRejectedValueOnce(
      new Error('connection interrupted'),
    );
    await expect(uploadDocumentResumable(3, file)).rejects.toThrow(
      'connection interrupted',
    );
    requestMock.get.mockResolvedValue({
      ...session,
      size: file.size + 1,
      uploadedChunks: [0],
    });
    requestMock.post.mockImplementation(async (url: string) =>
      url.endsWith('/complete')
        ? { document: { id: 2 } }
        : { ...session, sessionId: 'session-2' },
    );

    await uploadDocumentResumable(3, file);

    expect(
      requestMock.post.mock.calls.filter(([url]) =>
        url.endsWith('/upload-sessions'),
      ),
    ).toHaveLength(2);
    expect(requestMock.upload).toHaveBeenLastCalledWith(
      '/api/knowledge/documents/upload-sessions/session-2/chunks/1?totalChunks=2',
      { file: expect.any(Blob) },
    );
  });

  it('keeps the saved session when status is temporarily unavailable', async () => {
    requestMock.upload.mockRejectedValueOnce(
      new Error('connection interrupted'),
    );
    await expect(uploadDocumentResumable(3, file)).rejects.toThrow(
      'connection interrupted',
    );
    requestMock.get
      .mockRejectedValueOnce(new Error('network unavailable'))
      .mockResolvedValueOnce({ ...session, uploadedChunks: [0] });

    await expect(uploadDocumentResumable(3, file)).rejects.toThrow(
      'network unavailable',
    );
    await uploadDocumentResumable(3, file);

    expect(
      requestMock.post.mock.calls.filter(([url]) =>
        url.endsWith('/upload-sessions'),
      ),
    ).toHaveLength(1);
    expect(requestMock.get).toHaveBeenCalledTimes(2);
  });

  it('starts over after the server reports the saved session is gone', async () => {
    requestMock.upload.mockRejectedValueOnce(
      new Error('connection interrupted'),
    );
    await expect(uploadDocumentResumable(3, file)).rejects.toThrow(
      'connection interrupted',
    );
    requestMock.get.mockRejectedValueOnce({ status: 404 });
    requestMock.post.mockImplementation(async (url: string) =>
      url.endsWith('/complete')
        ? { document: { id: 2 } }
        : { ...session, sessionId: 'session-2' },
    );

    await uploadDocumentResumable(3, file);

    expect(
      requestMock.post.mock.calls.filter(([url]) =>
        url.endsWith('/upload-sessions'),
      ),
    ).toHaveLength(2);
    expect(requestMock.upload).toHaveBeenLastCalledWith(
      '/api/knowledge/documents/upload-sessions/session-2/chunks/1?totalChunks=2',
      { file: expect.any(Blob) },
    );
  });

  it('keeps progress below completion until the server registers the file', async () => {
    let finishRegistration!: (value: { document: { id: number } }) => void;
    const registration = new Promise<{ document: { id: number } }>(
      (resolve) => {
        finishRegistration = resolve;
      },
    );
    requestMock.post.mockImplementation(async (url: string) =>
      url.endsWith('/complete') ? registration : session,
    );
    const progress: number[] = [];

    const pending = uploadDocumentResumable(3, file, (percent) => {
      progress.push(percent);
    });
    await vi.waitFor(() =>
      expect(requestMock.post).toHaveBeenCalledWith(
        '/api/knowledge/documents/upload-sessions/session-1/complete',
      ),
    );
    expect(progress.at(-1)).toBe(99);
    expect(progress).not.toContain(100);

    finishRegistration({ document: { id: 1 } });
    await pending;
  });

  it('aborts the transfer and deletes its server session on explicit cancel', async () => {
    const controller = new AbortController();
    requestMock.upload.mockImplementation(async () => {
      controller.abort('user-cancel');
      throw new Error('request aborted');
    });

    await expect(
      uploadDocumentResumable(3, file, undefined, controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(requestMock.delete).toHaveBeenCalledWith(
      '/api/knowledge/documents/upload-sessions/session-1',
    );

    requestMock.upload.mockResolvedValue(session);
    await uploadDocumentResumable(3, file);
    expect(
      requestMock.post.mock.calls.filter(([url]) =>
        url.endsWith('/upload-sessions'),
      ),
    ).toHaveLength(2);
  });

  it('reports direct upload cancellation as cancellation', async () => {
    const controller = new AbortController();
    requestMock.upload.mockImplementation(async () => {
      controller.abort('user-cancel');
      throw new Error('request aborted');
    });

    await expect(
      uploadDocument(
        3,
        new File(['small'], 'small.txt'),
        undefined,
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

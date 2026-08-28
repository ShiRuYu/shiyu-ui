import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import {
  createMedia,
  createProfile,
  createRecord,
  createTag,
  createTimeline,
  deleteMedia,
  deleteProfile,
  deleteRecord,
  deleteTag,
  deleteTimeline,
  getMediaPage,
  getProfileOptions,
  getProfilePage,
  getRecordOptions,
  getRecordPage,
  getTagPage,
  getTimelineOptions,
  getTimelinePage,
  updateMedia,
  updateProfile,
  updateRecord,
  updateTag,
  updateTimeline,
} from '../index';

describe('record feature transport facades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue({ items: [], total: 0 });
    requestMock.post.mockResolvedValue({ ok: true });
  });

  it('maps CRUD operations to the record domain', async () => {
    await createProfile({ name: 'Ada' });
    await updateTag({ id: 3, name: 'study' });
    await deleteRecord(9);

    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/record/profile/create',
      { name: 'Ada' },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      2,
      '/api/record/tag/update',
      { id: 3, name: 'study' },
      { params: { id: 3 } },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      3,
      '/api/record/record/delete',
      null,
      { params: { id: 9 } },
    );
  });

  it('normalizes pagination and option facades', async () => {
    requestMock.get
      .mockResolvedValueOnce({ items: [{ id: 1, name: 'Ada' }], total: 1 })
      .mockResolvedValueOnce({
        items: [{ id: 2, content: 'A long record content' }],
        total: 1,
      });

    expect(await getProfileOptions()).toEqual([{ id: 1, name: 'Ada' }]);
    expect(await getRecordOptions()).toEqual([
      { id: 2, content: 'A long record conten' },
    ]);
    await getTimelinePage({ page: 2, pageSize: 5, profileId: 7 });

    expect(requestMock.get).toHaveBeenNthCalledWith(
      1,
      '/api/record/profile/list',
      { params: { pageNum: 1, pageSize: 1000 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      2,
      '/api/record/record/list',
      { params: { pageNum: 1, pageSize: 1000 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      3,
      '/api/record/timeline/list',
      { params: { pageNum: 2, pageSize: 5, profileId: 7 } },
    );
  });

  it('covers media, profile, record, tag and timeline lifecycles', async () => {
    const payload = {} as any;
    await getMediaPage();
    await getProfilePage();
    await getRecordPage();
    await getTagPage();
    await getTimelinePage(undefined as any);
    await getMediaPage({ page: 2, pageSize: 5, type: 'IMAGE' });
    await createMedia(payload);
    await updateMedia(1, payload);
    await deleteMedia(1);

    await getProfilePage({});
    await createProfile(payload);
    await updateProfile({ id: 1, name: 'Ada' } as any);
    await deleteProfile(1);

    await getRecordPage({});
    await createRecord(payload);
    await updateRecord({ id: 1, content: 'entry' } as any);
    await deleteRecord(1);

    await getTagPage({ page: 2, pageSize: 5, name: 'study' });
    await createTag({ name: 'study' });
    await updateTag({ id: 1, name: 'learning' });
    await deleteTag(1);

    await getTimelinePage({});
    await createTimeline(payload);
    await updateTimeline({ id: 1, title: 'milestone' } as any);
    await deleteTimeline(1);
    await getTimelineOptions();

    expect(requestMock.get).toHaveBeenCalledWith('/api/record/media/list', {
      params: { pageNum: 2, pageSize: 5, type: 'IMAGE' },
    });
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/record/timeline/delete',
      null,
      { params: { id: 1 } },
    );
  });
});

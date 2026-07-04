import { requestClient } from '#/api/request';

export namespace EducationChapterApi {
  export interface Chapter {
    [key: string]: any;
    id: number;
    textbookId: number;
    parentId: null | number;
    name: string;
    chapterOrder: number;
    children: Chapter[] | null;
  }
}

async function getChapterById(id: number) {
  return requestClient.get<EducationChapterApi.Chapter>(`/api/chapter/${id}`);
}

async function getChaptersByTextbook(textbookId: number) {
  return requestClient.get<EducationChapterApi.Chapter[]>(
    `/api/chapter/textbook/${textbookId}`,
  );
}

async function getChapterTree(textbookId: number) {
  return requestClient.get<EducationChapterApi.Chapter[]>(
    `/api/chapter/textbook/${textbookId}/tree`,
  );
}

async function createChapter(
  data: Omit<EducationChapterApi.Chapter, 'children' | 'id'>,
) {
  return requestClient.post('/api/chapter', data);
}

async function updateChapter(
  id: number,
  data: Partial<EducationChapterApi.Chapter>,
) {
  return requestClient.put(`/api/chapter/${id}`, data);
}

async function deleteChapter(id: number) {
  return requestClient.delete(`/api/chapter/${id}`);
}

export {
  createChapter,
  deleteChapter,
  getChapterById,
  getChaptersByTextbook,
  getChapterTree,
  updateChapter,
};

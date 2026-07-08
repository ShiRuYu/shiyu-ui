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
  return requestClient.get<EducationChapterApi.Chapter>('/edu/chapter/detail', {
    params: { id },
  });
}

async function getChaptersByTextbook(textbookId: number) {
  return requestClient.get<EducationChapterApi.Chapter[]>(
    '/edu/chapter/textbook',
    { params: { textbookId } },
  );
}

async function getChapterTree(textbookId: number) {
  return requestClient.get<EducationChapterApi.Chapter[]>(
    '/edu/chapter/textbook-tree',
    { params: { textbookId } },
  );
}

async function createChapter(
  data: Omit<EducationChapterApi.Chapter, 'children' | 'id'>,
) {
  return requestClient.post('/edu/chapter/create', data);
}

async function updateChapter(
  id: number,
  data: Partial<EducationChapterApi.Chapter>,
) {
  return requestClient.post('/edu/chapter/update', data, { params: { id } });
}

async function deleteChapter(id: number) {
  return requestClient.post('/edu/chapter/delete', null, { params: { id } });
}

export {
  createChapter,
  deleteChapter,
  getChapterById,
  getChaptersByTextbook,
  getChapterTree,
  updateChapter,
};

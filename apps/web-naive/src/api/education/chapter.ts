import { requestClient } from '#/api/request';

export namespace EducationChapterApi {
  /** 章节 */
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

/** 获取章节详情 */
export async function getChapterById(id: number) {
  return requestClient.get<EducationChapterApi.Chapter>('/edu/chapter/detail', {
    params: { id },
  });
}

/** 获取教材所有章节（平铺） */
export async function getChaptersByTextbook(textbookId: number) {
  return requestClient.get<EducationChapterApi.Chapter[]>(
    '/edu/chapter/textbook',
    { params: { textbookId } },
  );
}

/** 获取教材章节树 */
export async function getChapterTree(textbookId: number) {
  return requestClient.get<EducationChapterApi.Chapter[]>(
    '/edu/chapter/textbook-tree',
    { params: { textbookId } },
  );
}

/** 创建章节 */
export async function createChapter(
  data: Omit<EducationChapterApi.Chapter, 'children' | 'id'>,
) {
  return requestClient.post('/edu/chapter/create', data);
}

/** 更新章节 */
export async function updateChapter(
  id: number,
  data: Partial<EducationChapterApi.Chapter>,
) {
  return requestClient.post('/edu/chapter/update', data, { params: { id } });
}

/** 删除章节 */
export async function deleteChapter(id: number) {
  return requestClient.post('/edu/chapter/delete', null, { params: { id } });
}

/** 获取章节下拉选项 */
export async function getChapterOptions(textbookId?: number) {
  const chapters = textbookId
    ? await getChaptersByTextbook(textbookId)
    : await getChaptersByTextbook(0);
  return (chapters || []).map((c: any) => ({ id: c.id, name: c.name }));
}

// ---- 兼容别名（部分旧代码使用 *Api 后缀） ----
export const getChapterDetailApi = getChapterById;
export const getChapterByTextbookApi = getChaptersByTextbook;
export const getChapterTreeApi = getChapterTree;
export const createChapterApi = createChapter;
export const updateChapterApi = updateChapter;
export const deleteChapterApi = deleteChapter;

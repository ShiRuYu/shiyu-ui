import { requestClient } from '#/api/request';

export namespace EducationTextbookApi {
  export interface PageData<T> {
    items: T[];
    total: number;
  }

  export interface Textbook {
    [key: string]: any;
    id: number;
    name: string;
    subjectCode: string;
    grade: number;
    publisher: string;
    isbn: string;
  }
}

async function getTextbookList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationTextbookApi.PageData<EducationTextbookApi.Textbook>>('/edu/textbook/list', {
    params: { pageNum, pageSize },
  });
}

async function getTextbookById(id: number) {
  return requestClient.get<EducationTextbookApi.Textbook>(
    '/edu/textbook/detail', { params: { id } },
  );
}

async function getTextbookBySubjectGrade(subjectCode: string, grade: number) {
  return requestClient.get<EducationTextbookApi.Textbook[]>(
    '/edu/textbook/subject-grade',
    { params: { subjectCode, grade } },
  );
}

async function createTextbook(data: Omit<EducationTextbookApi.Textbook, 'id'>) {
  return requestClient.post('/edu/textbook/create', data);
}

async function updateTextbook(
  id: number,
  data: Partial<EducationTextbookApi.Textbook>,
) {
  return requestClient.post('/edu/textbook/update', data, { params: { id } });
}

async function deleteTextbook(id: number) {
  return requestClient.post('/edu/textbook/delete', null, { params: { id } });
}

export {
  createTextbook,
  deleteTextbook,
  getTextbookById,
  getTextbookBySubjectGrade,
  getTextbookList,
  updateTextbook,
};

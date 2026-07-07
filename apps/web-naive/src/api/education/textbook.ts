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
  return requestClient.get<EducationTextbookApi.PageData<EducationTextbookApi.Textbook>>('/api/textbook', {
    params: { pageNum, pageSize },
  });
}

async function getTextbookById(id: number) {
  return requestClient.get<EducationTextbookApi.Textbook>(
    `/api/textbook/${id}`,
  );
}

async function getTextbookBySubjectGrade(subjectCode: string, grade: number) {
  return requestClient.get<EducationTextbookApi.Textbook[]>(
    `/api/textbook/subject/${subjectCode}/grade/${grade}`,
  );
}

async function createTextbook(data: Omit<EducationTextbookApi.Textbook, 'id'>) {
  return requestClient.post('/api/textbook', data);
}

async function updateTextbook(
  id: number,
  data: Partial<EducationTextbookApi.Textbook>,
) {
  return requestClient.put(`/api/textbook/${id}`, data);
}

async function deleteTextbook(id: number) {
  return requestClient.delete(`/api/textbook/${id}`);
}

export {
  createTextbook,
  deleteTextbook,
  getTextbookById,
  getTextbookBySubjectGrade,
  getTextbookList,
  updateTextbook,
};

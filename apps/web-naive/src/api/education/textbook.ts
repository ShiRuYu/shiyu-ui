import { requestClient } from '#/api/request';

export namespace EducationTextbookApi {
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

async function getTextbookList() {
  return requestClient.get<EducationTextbookApi.Textbook[]>('/api/v1/textbook');
}

async function getTextbookById(id: number) {
  return requestClient.get<EducationTextbookApi.Textbook>(
    `/api/v1/textbook/${id}`,
  );
}

async function getTextbookBySubjectGrade(subjectCode: string, grade: number) {
  return requestClient.get<EducationTextbookApi.Textbook[]>(
    `/api/v1/textbook/subject/${subjectCode}/grade/${grade}`,
  );
}

async function createTextbook(data: Omit<EducationTextbookApi.Textbook, 'id'>) {
  return requestClient.post('/api/v1/textbook', data);
}

async function updateTextbook(
  id: number,
  data: Partial<EducationTextbookApi.Textbook>,
) {
  return requestClient.put(`/api/v1/textbook/${id}`, data);
}

async function deleteTextbook(id: number) {
  return requestClient.delete(`/api/v1/textbook/${id}`);
}

export {
  createTextbook,
  deleteTextbook,
  getTextbookById,
  getTextbookBySubjectGrade,
  getTextbookList,
  updateTextbook,
};

import { requestClient } from '#/api/request';

export namespace EducationSubjectApi {
  export interface PageData<T> {
    items: T[];
    total: number;
  }

  export interface Subject {
    [key: string]: any;
    id: number;
    code: string;
    name: string;
    gradeLevel: string;
    icon: string;
    sortOrder: number;
  }
}

async function getSubjectList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationSubjectApi.PageData<EducationSubjectApi.Subject>>('/api/subject', {
    params: { pageNum, pageSize },
  });
}

async function getSubjectById(id: number) {
  return requestClient.get<EducationSubjectApi.Subject>(`/api/subject/${id}`);
}

async function getSubjectByCode(code: string) {
  return requestClient.get<EducationSubjectApi.Subject>(
    `/api/subject/code/${code}`,
  );
}

async function getSubjectByGradeLevel(gradeLevel: string) {
  return requestClient.get<EducationSubjectApi.Subject[]>(
    `/api/subject/grade-level/${gradeLevel}`,
  );
}

async function createSubject(data: Omit<EducationSubjectApi.Subject, 'id'>) {
  return requestClient.post('/api/subject', data);
}

async function updateSubject(
  id: number,
  data: Partial<EducationSubjectApi.Subject>,
) {
  return requestClient.put(`/api/subject/${id}`, data);
}

async function deleteSubject(id: number) {
  return requestClient.delete(`/api/subject/${id}`);
}

export {
  createSubject,
  deleteSubject,
  getSubjectByCode,
  getSubjectByGradeLevel,
  getSubjectById,
  getSubjectList,
  updateSubject,
};

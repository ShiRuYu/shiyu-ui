import { requestClient } from '#/api/request';

export namespace EducationSubjectApi {
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

async function getSubjectList() {
  return requestClient.get<EducationSubjectApi.Subject[]>('/api/v1/subject');
}

async function getSubjectById(id: number) {
  return requestClient.get<EducationSubjectApi.Subject>(
    `/api/v1/subject/${id}`,
  );
}

async function getSubjectByCode(code: string) {
  return requestClient.get<EducationSubjectApi.Subject>(
    `/api/v1/subject/code/${code}`,
  );
}

async function getSubjectByGradeLevel(gradeLevel: string) {
  return requestClient.get<EducationSubjectApi.Subject[]>(
    `/api/v1/subject/grade-level/${gradeLevel}`,
  );
}

async function createSubject(data: Omit<EducationSubjectApi.Subject, 'id'>) {
  return requestClient.post('/api/v1/subject', data);
}

async function updateSubject(
  id: number,
  data: Partial<EducationSubjectApi.Subject>,
) {
  return requestClient.put(`/api/v1/subject/${id}`, data);
}

async function deleteSubject(id: number) {
  return requestClient.delete(`/api/v1/subject/${id}`);
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

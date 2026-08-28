import { requestClient } from '#/shared/api/request';

export namespace EducationSubjectApi {
  export interface PageResult<T> {
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
  return requestClient.get<
    EducationSubjectApi.PageResult<EducationSubjectApi.Subject>
  >('/api/education/subject/list', {
    params: { pageNum, pageSize },
  });
}

async function getSubjectById(id: number) {
  return requestClient.get<EducationSubjectApi.Subject>(
    '/api/education/subject/detail',
    {
      params: { id },
    },
  );
}

async function getSubjectByCode(code: string) {
  return requestClient.get<EducationSubjectApi.Subject>(
    '/api/education/subject/code',
    {
      params: { code },
    },
  );
}

async function getSubjectByGradeLevel(gradeLevel: string) {
  return requestClient.get<EducationSubjectApi.Subject[]>(
    '/api/education/subject/grade-level',
    { params: { gradeLevel } },
  );
}

async function createSubject(data: Omit<EducationSubjectApi.Subject, 'id'>) {
  return requestClient.post('/api/education/subject/create', data);
}

async function updateSubject(
  id: number,
  data: Partial<EducationSubjectApi.Subject>,
) {
  return requestClient.post('/api/education/subject/update', data, {
    params: { id },
  });
}

async function deleteSubject(id: number) {
  return requestClient.post('/api/education/subject/delete', null, {
    params: { id },
  });
}

async function getSubjectOptions() {
  const result = await getSubjectList(1, 1000);
  return (result?.items || []).map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
  }));
}

export {
  createSubject,
  deleteSubject,
  getSubjectByCode,
  getSubjectByGradeLevel,
  getSubjectById,
  getSubjectList,
  getSubjectOptions,
  updateSubject,
};

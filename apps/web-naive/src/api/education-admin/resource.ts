import { requestClient } from '#/api/request';

export namespace EducationResourceApi {
  export interface PageResult<T> {
    items: T[];
    total: number;
  }

  export interface Resource {
    [key: string]: any;
    id: number;
    name: string;
    type: string;
    url: string;
    subjectCode: string;
    grade: number;
    difficulty: number;
    coverUrl: string;
    description: string;
    viewCount: number;
  }
}

async function getResourceList(pageNum = 1, pageSize = 10) {
  return requestClient.get<
    EducationResourceApi.PageResult<EducationResourceApi.Resource>
  >('/v1/education/resource/list', {
    params: { pageNum, pageSize },
  });
}

async function getResourceById(id: number) {
  return requestClient.get<EducationResourceApi.Resource>(
    '/v1/education/resource/detail',
    { params: { id } },
  );
}

async function getResourceBySubject(subjectCode: string) {
  return requestClient.get<EducationResourceApi.Resource[]>(
    '/v1/education/resource/subject',
    { params: { subjectCode } },
  );
}

async function getResourceByType(type: string) {
  return requestClient.get<EducationResourceApi.Resource[]>(
    '/v1/education/resource/type',
    { params: { type } },
  );
}

async function createResource(data: Omit<EducationResourceApi.Resource, 'id'>) {
  return requestClient.post('/v1/education/resource/create', data);
}

async function updateResource(
  id: number,
  data: Partial<EducationResourceApi.Resource>,
) {
  return requestClient.post('/v1/education/resource/update', data, { params: { id } });
}

async function deleteResource(id: number) {
  return requestClient.post('/v1/education/resource/delete', null, { params: { id } });
}

export {
  createResource,
  deleteResource,
  getResourceById,
  getResourceBySubject,
  getResourceByType,
  getResourceList,
  updateResource,
};

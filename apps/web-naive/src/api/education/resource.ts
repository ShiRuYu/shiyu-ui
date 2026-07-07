import { requestClient } from '#/api/request';

export namespace EducationResourceApi {
  export interface PageData<T> {
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
  return requestClient.get<EducationResourceApi.PageData<EducationResourceApi.Resource>>('/api/resource', {
    params: { pageNum, pageSize },
  });
}

async function getResourceById(id: number) {
  return requestClient.get<EducationResourceApi.Resource>(
    `/api/resource/${id}`,
  );
}

async function getResourceBySubject(subjectCode: string) {
  return requestClient.get<EducationResourceApi.Resource[]>(
    `/api/resource/subject/${subjectCode}`,
  );
}

async function getResourceByType(type: string) {
  return requestClient.get<EducationResourceApi.Resource[]>(
    `/api/resource/type/${type}`,
  );
}

async function createResource(data: Omit<EducationResourceApi.Resource, 'id'>) {
  return requestClient.post('/api/resource', data);
}

async function updateResource(
  id: number,
  data: Partial<EducationResourceApi.Resource>,
) {
  return requestClient.put(`/api/resource/${id}`, data);
}

async function deleteResource(id: number) {
  return requestClient.delete(`/api/resource/${id}`);
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

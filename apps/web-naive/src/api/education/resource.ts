import { requestClient } from '#/api/request';

export namespace EducationResourceApi {
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

async function getResourceList() {
  return requestClient.get<EducationResourceApi.Resource[]>('/api/v1/resource');
}

async function getResourceById(id: number) {
  return requestClient.get<EducationResourceApi.Resource>(
    `/api/v1/resource/${id}`,
  );
}

async function getResourceBySubject(subjectCode: string) {
  return requestClient.get<EducationResourceApi.Resource[]>(
    `/api/v1/resource/subject/${subjectCode}`,
  );
}

async function getResourceByType(type: string) {
  return requestClient.get<EducationResourceApi.Resource[]>(
    `/api/v1/resource/type/${type}`,
  );
}

async function createResource(data: Omit<EducationResourceApi.Resource, 'id'>) {
  return requestClient.post('/api/v1/resource', data);
}

async function updateResource(
  id: number,
  data: Partial<EducationResourceApi.Resource>,
) {
  return requestClient.put(`/api/v1/resource/${id}`, data);
}

async function deleteResource(id: number) {
  return requestClient.delete(`/api/v1/resource/${id}`);
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

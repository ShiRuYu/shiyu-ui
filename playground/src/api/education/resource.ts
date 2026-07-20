import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ResourceApi {
  export interface Resource {
    [key: string]: any;
    coverUrl?: string;
    description?: string;
    difficulty: number;
    grade: number;
    id: number;
    name: string;
    subjectCode: string;
    type: string;
    url: string;
    viewCount: number;
  }
}

async function getResourceById(id: number) {
  return requestClient.get<ResourceApi.Resource>(`/api/v1/resource/${id}`);
}

async function listAllResources() {
  return requestClient.get<ResourceApi.Resource[]>('/api/v1/resource');
}

async function listBySubjectCode(subjectCode: string) {
  return requestClient.get<ResourceApi.Resource[]>(
    `/api/v1/resource/subject/${subjectCode}`,
  );
}

async function listByType(type: string) {
  return requestClient.get<ResourceApi.Resource[]>(
    `/api/v1/resource/type/${type}`,
  );
}

async function createResource(data: Recordable<any>) {
  return requestClient.post<ResourceApi.Resource>('/api/v1/resource', data);
}

async function updateResource(id: number, data: Recordable<any>) {
  return requestClient.put(`/api/v1/resource/${id}`, data);
}

async function deleteResource(id: number) {
  return requestClient.delete(`/api/v1/resource/${id}`);
}

export {
  createResource,
  deleteResource,
  getResourceById,
  listAllResources,
  listBySubjectCode,
  listByType,
  updateResource,
};

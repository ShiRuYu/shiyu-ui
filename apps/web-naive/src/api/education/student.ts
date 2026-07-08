import { requestClient } from '#/api/request';

export namespace EducationStudentApi {
  export interface PageData<T> {
    items: T[];
    total: number;
  }

  export interface Student {
    id: number;
    userId?: number;
    studentNo: string;
    name: string;
    gender?: number;
    grade?: number;
    gradeLevel?: string;
    school?: string;
    className?: string;
  }

  export interface StudentRequest {
    userId?: number;
    studentNo: string;
    name: string;
    gender?: number;
    grade?: number;
    gradeLevel?: string;
    school?: string;
    className?: string;
  }
}

async function getStudentList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationStudentApi.PageData<EducationStudentApi.Student>>('/edu/student/list', {
    params: { pageNum, pageSize },
  });
}

async function getStudentById(id: number) {
  return requestClient.get<EducationStudentApi.Student>('/edu/student/detail', {
    params: { id },
  });
}

async function createStudent(data: EducationStudentApi.StudentRequest) {
  return requestClient.post<EducationStudentApi.Student>('/edu/student/create', data);
}

async function updateStudent(
  id: number,
  data: EducationStudentApi.StudentRequest,
) {
  return requestClient.post('/edu/student/update', data, { params: { id } });
}

async function deleteStudent(id: number) {
  return requestClient.post('/edu/student/delete', null, { params: { id } });
}

export {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudentList,
  updateStudent,
};

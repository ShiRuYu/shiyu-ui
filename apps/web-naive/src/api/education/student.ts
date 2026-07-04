import { requestClient } from '#/api/request';

export namespace EducationStudentApi {
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

async function getStudentList() {
  return requestClient.get<EducationStudentApi.Student[]>('/api/student');
}

async function getStudentById(id: number) {
  return requestClient.get<EducationStudentApi.Student>(`/api/student/${id}`);
}

async function createStudent(data: EducationStudentApi.StudentRequest) {
  return requestClient.post<EducationStudentApi.Student>('/api/student', data);
}

async function updateStudent(
  id: number,
  data: EducationStudentApi.StudentRequest,
) {
  return requestClient.put(`/api/student/${id}`, data);
}

async function deleteStudent(id: number) {
  return requestClient.delete(`/api/student/${id}`);
}

export {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudentList,
  updateStudent,
};

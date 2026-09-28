import { requestClient } from '#/shared/api/request';

export namespace EducationStudentApi {
  export interface PageResult<T> {
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
  return requestClient.get<
    EducationStudentApi.PageResult<EducationStudentApi.Student>
  >('/api/education/students', {
    params: { pageNum, pageSize },
  });
}

async function getStudentById(id: number) {
  return requestClient.get<EducationStudentApi.Student>(
    `/api/education/students/${id}`,
  );
}

async function createStudent(data: EducationStudentApi.StudentRequest) {
  return requestClient.post<EducationStudentApi.Student>(
    '/api/education/students',
    data,
  );
}

async function updateStudent(
  id: number,
  data: EducationStudentApi.StudentRequest,
) {
  return requestClient.put(`/api/education/students/${id}`, data);
}

async function deleteStudent(id: number) {
  return requestClient.delete(`/api/education/students/${id}`);
}

async function getStudentOptions() {
  const result = await getStudentList(1, 1000);
  return result.items.map((student) => ({
    id: student.id,
    name: `[${student.studentNo}] ${student.name}`,
  }));
}

export {
  createStudent,
  deleteStudent,
  getStudentById,
  getStudentList,
  getStudentOptions,
  updateStudent,
};

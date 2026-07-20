import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace StudyPlanApi {
  export interface StudyPlan {
    [key: string]: any;
    id: number;
    studentId: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    totalItems?: number;
    completedItems?: number;
    items?: DailyTask[];
  }

  export interface DailyTask {
    id: number;
    knowledgeId: number;
    knowledgeName: string;
    planDate: string;
    status: string;
    orderNo: number;
  }

  export interface CreatePlan {
    studentId: number;
    name: string;
    startDate: string;
    endDate: string;
  }
}

async function getPlanById(id: number) {
  return requestClient.get<StudyPlanApi.StudyPlan>(`/api/v1/plan/${id}`);
}

async function listByStudentId(studentId: number) {
  return requestClient.get<StudyPlanApi.StudyPlan[]>(
    `/api/v1/plan/student/${studentId}`,
  );
}

async function listActiveByStudent(studentId: number) {
  return requestClient.get<StudyPlanApi.StudyPlan[]>(
    `/api/v1/plan/student/${studentId}/active`,
  );
}

async function createPlan(data: StudyPlanApi.CreatePlan) {
  return requestClient.post<StudyPlanApi.StudyPlan>('/api/v1/plan', data);
}

async function updatePlan(id: number, data: Partial<StudyPlanApi.CreatePlan>) {
  return requestClient.put(`/api/v1/plan/${id}`, data);
}

async function getTodayTasks(studentId: number) {
  return requestClient.get<StudyPlanApi.DailyTask[]>(
    `/api/v1/plan/today/${studentId}`,
  );
}

async function deletePlan(id: number) {
  return requestClient.delete(`/api/v1/plan/${id}`);
}

export {
  createPlan,
  deletePlan,
  getPlanById,
  getTodayTasks,
  listActiveByStudent,
  listByStudentId,
  updatePlan,
};

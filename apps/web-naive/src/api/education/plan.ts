import { requestClient } from '#/api/request';

export namespace EducationPlanApi {
  export interface StudyPlan {
    [key: string]: any;
    id: number;
    studentId: number;
    name: string;
    startDate: string;
    endDate: string;
    status: string;
    totalItems: number;
    completedItems: number;
    items: DailyTask[];
  }
  export interface DailyTask {
    id: number;
    knowledgeId: number;
    knowledgeName: string;
    planDate: string;
    status: string;
    orderNo: number;
  }
}

async function getPlanById(id: number) {
  return requestClient.get<EducationPlanApi.StudyPlan>(`/api/v1/plan/${id}`);
}

async function getPlansByStudent(studentId: number) {
  return requestClient.get<EducationPlanApi.StudyPlan[]>(
    `/api/v1/plan/student/${studentId}`,
  );
}

async function getActivePlans(studentId: number) {
  return requestClient.get<EducationPlanApi.StudyPlan[]>(
    `/api/v1/plan/student/${studentId}/active`,
  );
}

async function getTodayTasks(studentId: number) {
  return requestClient.get<EducationPlanApi.DailyTask[]>(
    `/api/v1/plan/today/${studentId}`,
  );
}

async function createPlan(data: Omit<EducationPlanApi.StudyPlan, 'id'>) {
  return requestClient.post('/api/v1/plan', data);
}

async function updatePlan(
  id: number,
  data: Partial<EducationPlanApi.StudyPlan>,
) {
  return requestClient.put(`/api/v1/plan/${id}`, data);
}

async function deletePlan(id: number) {
  return requestClient.delete(`/api/v1/plan/${id}`);
}

export {
  createPlan,
  deletePlan,
  getActivePlans,
  getPlanById,
  getPlansByStudent,
  getTodayTasks,
  updatePlan,
};

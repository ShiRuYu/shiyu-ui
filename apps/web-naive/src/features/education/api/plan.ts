import { requestClient } from '#/shared/api/request';

export namespace EducationPlanApi {
  export interface StudyPlan {
    [key: string]: any;
    id: number;
    studentId: number;
    name: string;
    startDate: string;
    endDate: string;
    status: number;
    statusDesc?: string;
    totalItems: number;
    completedItems: number;
    items: DailyTask[];
  }
  export interface DailyTask {
    id: number;
    knowledgeId: number;
    knowledgeName: string;
    planDate: string;
    status: number;
    statusDesc?: string;
    orderNo: number;
  }
}

async function getPlanById(id: number) {
  return requestClient.get<EducationPlanApi.StudyPlan>(
    `/api/education/study-plan/${id}`,
  );
}

async function getPlansByStudent(studentId: number) {
  return requestClient.get<EducationPlanApi.StudyPlan[]>(
    '/api/education/study-plan/student',
    {
      params: { studentId },
    },
  );
}

async function getActivePlans(studentId: number) {
  return requestClient.get<EducationPlanApi.StudyPlan[]>(
    '/api/education/study-plan/active',
    {
      params: { studentId },
    },
  );
}

async function getTodayTasks(studentId: number) {
  return requestClient.get<EducationPlanApi.DailyTask[]>(
    '/api/education/study-plan/today-tasks',
    {
      params: { studentId },
    },
  );
}

async function createPlan(data: Omit<EducationPlanApi.StudyPlan, 'id'>) {
  return requestClient.post('/api/education/study-plan', data);
}

async function updatePlan(
  id: number,
  data: Partial<EducationPlanApi.StudyPlan>,
) {
  return requestClient.put(`/api/education/study-plan/${id}`, data);
}

async function deletePlan(id: number) {
  return requestClient.delete(`/api/education/study-plan/${id}`);
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

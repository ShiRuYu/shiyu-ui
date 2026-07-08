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
  return requestClient.get<EducationPlanApi.StudyPlan>('/edu/plan/detail', {
    params: { id },
  });
}

async function getPlansByStudent(studentId: number) {
  return requestClient.get<EducationPlanApi.StudyPlan[]>(
    '/edu/plan/student',
    { params: { studentId } },
  );
}

async function getActivePlans(studentId: number) {
  return requestClient.get<EducationPlanApi.StudyPlan[]>(
    '/edu/plan/active',
    { params: { studentId } },
  );
}

async function getTodayTasks(studentId: number) {
  return requestClient.get<EducationPlanApi.DailyTask[]>(
    '/edu/plan/today',
    { params: { studentId } },
  );
}

async function createPlan(data: Omit<EducationPlanApi.StudyPlan, 'id'>) {
  return requestClient.post('/edu/plan/create', data);
}

async function updatePlan(
  id: number,
  data: Partial<EducationPlanApi.StudyPlan>,
) {
  return requestClient.post('/edu/plan/update', data, { params: { id } });
}

async function deletePlan(id: number) {
  return requestClient.post('/edu/plan/delete', null, { params: { id } });
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

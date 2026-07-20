import { requestClient } from '#/api/request';

export namespace AnalyticsApi {
  export interface Overview {
    accuracy: number;
    masteredKnowledge: number;
    streakDays: number;
    totalKnowledge: number;
    totalQuestions: number;
    totalStudyDays: number;
    weeklyHours: number;
  }

  export interface AbilityRadar {
    abilities: Record<string, number>;
    knowledgeId: number;
    overallMastery: number;
    studentId: number;
  }

  export interface Trend {
    dates: string[];
    values: number[];
  }

  export interface WeakPoint {
    knowledgeId: number;
    knowledgeName: string;
    mastery: number;
  }

  export interface StudyRecord {
    [key: string]: any;
    createdAt: string;
    id: number;
    knowledgeId: number;
    score: number;
    studentId: number;
    type: string;
  }
}

async function getOverview(studentId: number) {
  return requestClient.get<AnalyticsApi.Overview>(
    '/api/v1/analytics/overview',
    {
      params: { studentId },
    },
  );
}

async function getAbilityRadar(studentId: number, knowledgeId: number) {
  return requestClient.get<AnalyticsApi.AbilityRadar>(
    '/api/v1/analytics/ability-radar',
    { params: { studentId, knowledgeId } },
  );
}

async function getTrend(studentId: number) {
  return requestClient.get<AnalyticsApi.Trend>('/api/v1/analytics/trend', {
    params: { studentId },
  });
}

async function getWeakPoints(studentId: number) {
  return requestClient.get<AnalyticsApi.WeakPoint[]>(
    '/api/v1/analytics/weak-points',
    { params: { studentId } },
  );
}

async function listRecordsByStudent(studentId: number) {
  return requestClient.get<AnalyticsApi.StudyRecord[]>(
    `/api/v1/analytics/records/student/${studentId}`,
  );
}

export {
  getAbilityRadar,
  getOverview,
  getTrend,
  getWeakPoints,
  listRecordsByStudent,
};

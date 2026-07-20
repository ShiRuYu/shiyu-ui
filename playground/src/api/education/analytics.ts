import { requestClient } from '#/api/request';

export namespace AnalyticsApi {
  export interface Overview {
    totalStudyDays: number;
    totalKnowledge: number;
    masteredKnowledge: number;
    totalQuestions: number;
    accuracy: number;
    weeklyHours: number;
    streakDays: number;
  }

  export interface AbilityRadar {
    studentId: number;
    knowledgeId: number;
    abilities: Record<string, number>;
    overallMastery: number;
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
    id: number;
    studentId: number;
    knowledgeId: number;
    type: string;
    score: number;
    createdAt: string;
  }
}

async function getOverview(studentId: number) {
  return requestClient.get<AnalyticsApi.Overview>('/api/v1/analytics/overview', {
    params: { studentId },
  });
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

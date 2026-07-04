import { requestClient } from '#/api/request';

export namespace EducationAnalyticsApi {
  export interface OverviewResponse {
    totalStudyDays: number;
    totalKnowledge: number;
    masteredKnowledge: number;
    totalQuestions: number;
    accuracy: number;
    weeklyHours: number;
    streakDays: number;
  }
  export interface AbilityRadarResponse {
    remember: number;
    understand: number;
    apply: number;
    analyze: number;
    evaluate: number;
    create: number;
  }
  export interface WeakPointResponse {
    knowledgeId: number;
    knowledgeName: string;
    subjectCode: string;
    mastery: number;
  }
  export interface TrendResponse {
    dates: string[];
    studyRecords: number[];
    masteredCount: number[];
  }
  export interface StudyRecord {
    [key: string]: any;
    id: number;
    studentId: number;
    knowledgeId: number;
    studyTime: string;
    duration: number;
    score: number;
  }
}

async function getOverview(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.OverviewResponse>(
    '/api/analytics/overview',
    { params: { studentId } },
  );
}

async function getAbilityRadar(studentId: number, knowledgeId: number) {
  return requestClient.get<EducationAnalyticsApi.AbilityRadarResponse>(
    '/api/analytics/ability-radar',
    { params: { studentId, knowledgeId } },
  );
}

async function getWeakPoints(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.WeakPointResponse[]>(
    '/api/analytics/weak-points',
    { params: { studentId } },
  );
}

async function getTrend(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.TrendResponse>(
    '/api/analytics/trend',
    { params: { studentId } },
  );
}

async function getStudyRecords(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.StudyRecord[]>(
    `/api/analytics/records/student/${studentId}`,
  );
}

async function getStudyRecordsByKnowledge(
  studentId: number,
  knowledgeId: number,
) {
  return requestClient.get<EducationAnalyticsApi.StudyRecord[]>(
    `/api/analytics/records/student/${studentId}/knowledge/${knowledgeId}`,
  );
}

async function createStudyRecord(
  data: Omit<EducationAnalyticsApi.StudyRecord, 'id'>,
) {
  return requestClient.post('/api/analytics/records', data);
}

export {
  createStudyRecord,
  getAbilityRadar,
  getOverview,
  getStudyRecords,
  getStudyRecordsByKnowledge,
  getTrend,
  getWeakPoints,
};

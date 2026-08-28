import { requestClient } from '#/shared/api/request';

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
    '/api/education/analytics/overview',
    { params: { studentId } },
  );
}

async function getAbilityRadar(studentId: number, knowledgeId: number) {
  return requestClient.get<EducationAnalyticsApi.AbilityRadarResponse>(
    '/api/education/analytics/ability-radar',
    { params: { studentId, knowledgeId } },
  );
}

async function getWeakPoints(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.WeakPointResponse[]>(
    '/api/education/analytics/weak-points',
    { params: { studentId } },
  );
}

async function getTrend(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.TrendResponse>(
    '/api/education/analytics/trend',
    { params: { studentId } },
  );
}

async function getStudyRecords(studentId: number) {
  return requestClient.get<EducationAnalyticsApi.StudyRecord[]>(
    '/api/education/analytics/records',
    { params: { studentId } },
  );
}

async function getStudyRecordsByKnowledge(
  studentId: number,
  knowledgeId: number,
) {
  return requestClient.get<EducationAnalyticsApi.StudyRecord[]>(
    '/api/education/analytics/records/knowledge',
    { params: { studentId, knowledgeId } },
  );
}

async function createStudyRecord(
  data: Omit<EducationAnalyticsApi.StudyRecord, 'id'>,
) {
  return requestClient.post('/api/education/analytics/record-create', data);
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

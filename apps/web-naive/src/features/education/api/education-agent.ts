import { requestClient } from '#/shared/api/request';

export namespace EducationAgentApi {
  export interface TeachRequest {
    knowledgeId: number;
    style?: string;
  }
  export interface PracticeRequest {
    knowledgeId: number;
    difficulty: number;
    count: number;
  }
  export interface PlannerRequest {
    knowledgeId: number;
    targetDate: string;
  }
  export interface ReportRequest {
    period: string;
  }
  export interface TutorKnowledge {
    id: number;
    name: string;
    description: string;
  }
  export interface TutorResponse {
    content: string;
    knowledgeId: null | number;
    knowledgeName: null | string;
    period: null | string;
    recordCount: number;
    averageScore: null | number;
    insufficientData: boolean;
    sources: {
      occurredAt: string;
      questionId: null | number;
      recordId: number;
      recordType: string;
      score: null | number;
    }[];
  }
}

function listTutorKnowledge() {
  return requestClient.get<EducationAgentApi.TutorKnowledge[]>(
    '/api/education/student-tutor/knowledge',
  );
}

function teach(data: EducationAgentApi.TeachRequest) {
  return requestClient.post<EducationAgentApi.TutorResponse>(
    '/api/education/student-tutor/teach',
    data,
  );
}

function practice(data: EducationAgentApi.PracticeRequest) {
  return requestClient.post<EducationAgentApi.TutorResponse>(
    '/api/education/student-tutor/practice',
    data,
  );
}

function generatePlan(data: EducationAgentApi.PlannerRequest) {
  return requestClient.post<EducationAgentApi.TutorResponse>(
    '/api/education/student-tutor/plan',
    data,
  );
}

function generateReport(data: EducationAgentApi.ReportRequest) {
  return requestClient.post<EducationAgentApi.TutorResponse>(
    '/api/education/student-tutor/report',
    data,
  );
}

export { generatePlan, generateReport, listTutorKnowledge, practice, teach };

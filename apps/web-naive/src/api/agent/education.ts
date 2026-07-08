import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/api/request';

export namespace EducationAgentApi {
  export interface TeachRequest {
    studentId: number;
    knowledgeId: number;
    style?: string;
  }
  export interface PracticeRequest {
    studentId: number;
    knowledgeId: number;
    difficulty: number;
    count: number;
  }
  export interface ExamRequest {
    studentId: number;
    knowledgeIds: number[];
    duration: number;
  }
  export interface PlannerRequest {
    studentId: number;
    knowledgeId: number;
    targetDate: string;
  }
  export interface ReportRequest {
    studentId: number;
    period: string;
  }
}

async function teach(data: EducationAgentApi.TeachRequest) {
  return requestClient.post('/agent/agent/execute', data, { params: { agentId: 'teacher' } });
}

async function teachStream(
  data: EducationAgentApi.TeachRequest,
  onMessage: (chunk: string) => void,
): Promise<void> {
  const accessStore = useAccessStore();
  const token = accessStore.accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const response = await fetch(
    `${baseURL}/agent/agent/execute-stream?agentId=${encodeURIComponent('teacher')}`,
    {
      body: JSON.stringify({ ...data, stream: true }),
      headers: {
        Accept: 'text/event-stream',
        Authorization: token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
  );
  if (!response.ok || !response.body)
    throw new Error(`Stream error: ${response.status}`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onMessage(decoder.decode(value, { stream: true }));
  }
}

async function practice(data: EducationAgentApi.PracticeRequest) {
  return requestClient.post('/agent/agent/execute', data, { params: { agentId: 'practice' } });
}

async function generateExam(data: EducationAgentApi.ExamRequest) {
  return requestClient.post('/agent/agent/execute', data, { params: { agentId: 'exam' } });
}

async function getTodayReviewTasks() {
  return requestClient.get('/agent/agent/list', { params: { agentId: 'review' } });
}

async function completeReviewTask(data: { result: number; taskId: number }) {
  return requestClient.post('/agent/agent/execute', data, { params: { agentId: 'review' } });
}

async function generatePlan(data: EducationAgentApi.PlannerRequest) {
  return requestClient.post('/agent/agent/execute', data, { params: { agentId: 'planner' } });
}

async function generateReport(data: EducationAgentApi.ReportRequest) {
  return requestClient.post('/agent/agent/execute', data, { params: { agentId: 'report' } });
}

export {
  completeReviewTask,
  generateExam,
  generatePlan,
  generateReport,
  getTodayReviewTasks,
  practice,
  teach,
  teachStream,
};

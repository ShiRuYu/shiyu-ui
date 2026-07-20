import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace ReviewTaskApi {
  export interface ReviewTask {
    [key: string]: any;
    id: number;
    knowledgeId: number;
    knowledgeName: string;
    previousMastery: number;
    reviewDate: string;
    reviewRound: number;
    status: string;
    studentId: number;
  }

  export interface CompleteRequest {
    resultScore: number;
  }
}

async function getReviewById(id: number) {
  return requestClient.get<ReviewTaskApi.ReviewTask>(`/api/v1/review/${id}`);
}

async function listTodayTasks(studentId: number) {
  return requestClient.get<ReviewTaskApi.ReviewTask[]>(
    `/api/v1/review/today/${studentId}`,
  );
}

async function listByStatus(studentId: number, status: string) {
  return requestClient.get<ReviewTaskApi.ReviewTask[]>(
    `/api/v1/review/student/${studentId}/status/${status}`,
  );
}

async function createReview(data: Recordable<any>) {
  return requestClient.post<ReviewTaskApi.ReviewTask>('/api/v1/review', data);
}

async function completeReview(id: number, data: ReviewTaskApi.CompleteRequest) {
  return requestClient.put(`/api/v1/review/${id}/complete`, data);
}

export {
  completeReview,
  createReview,
  getReviewById,
  listByStatus,
  listTodayTasks,
};

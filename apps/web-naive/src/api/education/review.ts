import { requestClient } from '#/api/request';

export namespace EducationReviewApi {
  export interface ReviewTask {
    [key: string]: any;
    id: number;
    studentId: number;
    knowledgeId: number;
    knowledgeName: string;
    reviewRound: number;
    reviewDate: string;
    status: string;
    resultScore: number;
  }
  export interface CompleteReviewRequest {
    studentId: number;
    resultScore: number;
  }
}

async function getReviewById(id: number) {
  return requestClient.get<EducationReviewApi.ReviewTask>(
    `/api/review/${id}`,
  );
}

async function getTodayReviews(studentId: number) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    `/api/review/today/${studentId}`,
  );
}

async function getReviewsByStatus(studentId: number, status: string) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    `/api/review/student/${studentId}/status/${status}`,
  );
}

async function createReview(data: Omit<EducationReviewApi.ReviewTask, 'id'>) {
  return requestClient.post('/api/review', data);
}

async function completeReview(
  id: number,
  data: EducationReviewApi.CompleteReviewRequest,
) {
  return requestClient.put(`/api/review/${id}/complete`, data);
}

export {
  completeReview,
  createReview,
  getReviewById,
  getReviewsByStatus,
  getTodayReviews,
};

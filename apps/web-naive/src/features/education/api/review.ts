import { requestClient } from '#/shared/api/request';

export namespace EducationReviewApi {
  export interface ReviewTask {
    [key: string]: any;
    id: number;
    studentId: number;
    knowledgeId: number;
    knowledgeName: string;
    reviewRound: number;
    reviewDate: string;
    status: number;
    statusDesc?: string;
    resultScore: number;
  }
  export interface CompleteReviewRequest {
    studentId: number;
    resultScore: number;
  }
}

async function getReviewById(id: number) {
  return requestClient.get<EducationReviewApi.ReviewTask>(
    `/api/education/review/${id}`,
  );
}

async function getTodayReviews(studentId: number) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    '/api/education/review/today',
    { params: { studentId } },
  );
}

async function getReviewsByStatus(studentId: number, status: number) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    '/api/education/review',
    { params: { studentId, status } },
  );
}

async function createReview(data: Omit<EducationReviewApi.ReviewTask, 'id'>) {
  return requestClient.post('/api/education/review', data);
}

async function updateReview(
  id: number,
  data: Partial<EducationReviewApi.ReviewTask>,
) {
  return requestClient.put(`/api/education/review/${id}`, data);
}

async function deleteReview(id: number) {
  return requestClient.delete(`/api/education/review/${id}`);
}

async function completeReview(
  id: number,
  data: EducationReviewApi.CompleteReviewRequest,
) {
  return requestClient.post('/api/education/review/complete', data, {
    params: { id },
  });
}

export {
  completeReview,
  createReview,
  deleteReview,
  getReviewById,
  getReviewsByStatus,
  getTodayReviews,
  updateReview,
};

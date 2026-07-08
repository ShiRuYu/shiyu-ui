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
  return requestClient.get<EducationReviewApi.ReviewTask>('/edu/review/detail', {
    params: { id },
  });
}

async function getTodayReviews(studentId: number) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    '/edu/review/today',
    { params: { studentId } },
  );
}

async function getReviewsByStatus(studentId: number, status: string) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    '/edu/review/list',
    { params: { studentId, status } },
  );
}

async function createReview(data: Omit<EducationReviewApi.ReviewTask, 'id'>) {
  return requestClient.post('/edu/review/create', data);
}

async function updateReview(
  id: number,
  data: Partial<EducationReviewApi.ReviewTask>,
) {
  return requestClient.post('/edu/review/update', data, { params: { id } });
}

async function completeReview(
  id: number,
  data: EducationReviewApi.CompleteReviewRequest,
) {
  return requestClient.post('/edu/review/complete', data, { params: { id } });
}

export {
  completeReview,
  createReview,
  getReviewById,
  getReviewsByStatus,
  getTodayReviews,
  updateReview,
};

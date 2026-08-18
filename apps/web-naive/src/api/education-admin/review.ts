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
    '/v1/education/review/detail',
    {
      params: { id },
    },
  );
}

async function getTodayReviews(studentId: number) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    '/v1/education/review/today',
    { params: { studentId } },
  );
}

async function getReviewsByStatus(studentId: number, status: number) {
  return requestClient.get<EducationReviewApi.ReviewTask[]>(
    '/v1/education/review/list',
    { params: { studentId, status } },
  );
}

async function createReview(data: Omit<EducationReviewApi.ReviewTask, 'id'>) {
  return requestClient.post('/v1/education/review/create', data);
}

async function updateReview(
  id: number,
  data: Partial<EducationReviewApi.ReviewTask>,
) {
  return requestClient.post('/v1/education/review/update', data, { params: { id } });
}

async function deleteReview(id: number) {
  return requestClient.post('/v1/education/review/delete', null, { params: { id } });
}

async function completeReview(
  id: number,
  data: EducationReviewApi.CompleteReviewRequest,
) {
  return requestClient.post('/v1/education/review/complete', data, { params: { id } });
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

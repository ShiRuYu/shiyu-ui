import { requestClient } from '#/shared/api/request';

export namespace EducationExamApi {
  export interface PageResult<T> {
    items: T[];
    total: number;
  }

  export interface Exam {
    id: number;
    name: string;
    type: string;
    subjectCode: string;
    grade: number;
    durationMin: number;
    totalScore: number;
    status: number;
    startTime?: string;
    endTime?: string;
    teacherId?: number;
  }

  export interface Summary {
    examId: number;
    name: string;
    type: string;
    subjectCode: string;
    grade: number;
    durationMin: number;
    totalScore: number;
    attemptId: null | number;
    attemptStatus: 'EXPIRED' | 'IN_PROGRESS' | 'NOT_STARTED' | 'SUBMITTED';
    deadlineAt: null | string;
    score: null | number;
  }

  export interface Option {
    value: string;
    label: string;
  }

  export interface PaperQuestion {
    id: number;
    questionId: number;
    title: string;
    type: string;
    score: number;
    options: Option[];
  }

  export interface PaperSection {
    id: number;
    name: string;
    orderNo: number;
    questions: PaperQuestion[];
  }

  export interface Paper {
    examId: number;
    attemptId: null | number;
    name: string;
    subjectCode: string;
    grade: number;
    durationMin: number;
    totalScore: number;
    deadlineAt: null | string;
    sections: PaperSection[];
  }

  export interface QuestionResult {
    questionId: number;
    title: string;
    answer: string;
    correctAnswer: string;
    analysis: null | string;
    score: number;
    maxScore: number;
  }

  export interface Result {
    attemptId: number;
    examId: number;
    status: 'EXPIRED' | 'SUBMITTED';
    score: number;
    totalScore: number;
    submittedAt: string;
    questions: QuestionResult[];
  }
}

async function getAvailableExams(
  pageNum = 1,
  pageSize = 10,
  subjectCode?: string,
) {
  return requestClient.get<EducationExamApi.PageResult<EducationExamApi.Exam>>(
    '/api/education/exam/available',
    { params: { pageNum, pageSize, ...(subjectCode ? { subjectCode } : {}) } },
  );
}

async function getAvailableExamSummaries(
  pageNum = 1,
  pageSize = 10,
  subjectCode?: string,
) {
  return requestClient.get<
    EducationExamApi.PageResult<EducationExamApi.Summary>
  >('/api/education/exam/available-summary', {
    params: { pageNum, pageSize, ...(subjectCode ? { subjectCode } : {}) },
  });
}

async function getExamHistory(pageNum = 1, pageSize = 10) {
  return requestClient.get<
    EducationExamApi.PageResult<EducationExamApi.Summary>
  >('/api/education/exam/history', { params: { pageNum, pageSize } });
}

async function getExamPaper(id: number) {
  return requestClient.get<EducationExamApi.Paper>(
    `/api/education/exam/${id}/paper`,
  );
}

async function startExamAttempt(id: number) {
  return requestClient.post<EducationExamApi.Paper>(
    `/api/education/exam/${id}/attempts`,
  );
}

async function getExamDraft(attemptId: number) {
  return requestClient.get<Record<string, string>>(
    `/api/education/exam/attempts/${attemptId}/draft`,
  );
}

async function saveExamDraft(
  attemptId: number,
  questionId: number,
  answer: string,
) {
  return requestClient.put<void>(
    `/api/education/exam/attempts/${attemptId}/draft`,
    { questionId, answer },
  );
}

async function submitExamAttempt(
  attemptId: number,
  answers: { answer: string; questionId: number }[],
) {
  return requestClient.post<EducationExamApi.Result>(
    `/api/education/exam/attempts/${attemptId}/submit`,
    { answers },
  );
}

async function getExamResult(attemptId: number) {
  return requestClient.get<EducationExamApi.Result>(
    `/api/education/exam/attempts/${attemptId}`,
  );
}

async function getExamList(pageNum = 1, pageSize = 10) {
  return requestClient.get<EducationExamApi.PageResult<EducationExamApi.Exam>>(
    '/api/education/exam',
    {
      params: { pageNum, pageSize },
    },
  );
}

async function getExamById(id: number) {
  return requestClient.get<EducationExamApi.Exam>(`/api/education/exam/${id}`);
}

async function getExamBySubject(subjectCode: string) {
  return requestClient.get<EducationExamApi.Exam[]>(
    '/api/education/exam/subject',
    {
      params: { subjectCode },
    },
  );
}

async function getExamByTeacher(teacherId: number) {
  return requestClient.get<EducationExamApi.Exam[]>(
    '/api/education/exam/teacher',
    {
      params: { teacherId },
    },
  );
}

async function createExam(data: Partial<EducationExamApi.Exam>) {
  return requestClient.post('/api/education/exam', data);
}

async function updateExam(id: number, data: Partial<EducationExamApi.Exam>) {
  return requestClient.put(`/api/education/exam/${id}`, data);
}

async function deleteExam(id: number) {
  return requestClient.delete(`/api/education/exam/${id}`);
}

export {
  createExam,
  deleteExam,
  getAvailableExams,
  getAvailableExamSummaries,
  getExamById,
  getExamBySubject,
  getExamByTeacher,
  getExamDraft,
  getExamHistory,
  getExamList,
  getExamPaper,
  getExamResult,
  saveExamDraft,
  startExamAttempt,
  submitExamAttempt,
  updateExam,
};

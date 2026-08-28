import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('#/shared/api/request', () => ({
  requestClient: requestMock,
}));

import {
  completeReview,
  createAdminExam,
  createChapter,
  createCourse,
  createExam,
  createQuestion,
  createResource,
  createReview,
  createStudyRecord,
  createStudent,
  createSubject,
  createTextbook,
  createWrongQuestion,
  deleteAdminExam,
  deleteChapter,
  deleteCourse,
  deleteExam,
  deleteQuestion,
  deleteResource,
  deleteReview,
  deleteStudent,
  deleteSubject,
  deleteTextbook,
  deleteWrongQuestion,
  getAbilityRadar,
  getActivePlans,
  getAdminExamById,
  getAdminExamList,
  getAllQuestions,
  getChapterById,
  getChapterKnowledgeIds,
  getChapterOptions,
  getChapterTree,
  getChaptersByTextbook,
  getCourseByGrade,
  getCourseById,
  getCourseBySubject,
  getCourseList,
  getExamById,
  getExamBySubject,
  getExamByTeacher,
  getExamList,
  getOverview,
  getPlanById,
  getPlansByStudent,
  getQuestionByDifficulty,
  getQuestionById,
  getQuestionBySubjectGrade,
  getQuestionByType,
  getQuestionOptions,
  getResourceById,
  getResourceBySubject,
  getResourceByType,
  getResourceList,
  getReviewById,
  getReviewsByStatus,
  getStudentById,
  getStudentList,
  getStudentOptions,
  getStudyRecords,
  getStudyRecordsByKnowledge,
  getSubjectByCode,
  getSubjectByGradeLevel,
  getSubjectById,
  getSubjectList,
  getSubjectOptions,
  getTextbookById,
  getTextbookBySubjectAndGrade,
  getTextbookList,
  getTextbookOptions,
  getTodayReviews,
  getTodayTasks,
  getTrend,
  getWeakPoints,
  getWrongQuestionById,
  getWrongQuestionsByStudent,
  replaceChapterKnowledgeIds,
  startLearning,
  updateChapter,
  updateCourse,
  updateExam,
  updateQuestion,
  updateResource,
  updateReview,
  updateStudent,
  updateSubject,
  updateTextbook,
  updateWrongQuestion,
} from '../index';

describe('education feature transport facades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue({ items: [] });
    requestMock.post.mockResolvedValue({});
  });

  it('keeps chapter calls tenant-scoped to the education API', async () => {
    await getChapterById(12);
    await createChapter({
      textbookId: 3,
      parentId: null,
      name: 'Algebra',
      chapterOrder: 1,
    } as any);

    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/education/chapter/detail',
      { params: { id: 12 } },
    );
    expect(requestMock.post).toHaveBeenCalledWith(
      '/api/education/chapter/create',
      expect.objectContaining({ textbookId: 3, name: 'Algebra' }),
    );
  });

  it('does not turn a missing textbook into a zero-id request', async () => {
    await expect(getChapterOptions()).resolves.toEqual([]);
    expect(requestMock.get).not.toHaveBeenCalled();
  });

  it('maps question options through the facade', async () => {
    requestMock.get.mockResolvedValueOnce({
      items: [
        { id: 1, title: 'Linear equations' },
        { id: 2, title: 'Quadratic equations' },
      ],
    });

    await expect(getQuestionOptions()).resolves.toEqual([
      { id: 1, title: 'Linear equations' },
      { id: 2, title: 'Quadratic equations' },
    ]);
    expect(requestMock.get).toHaveBeenCalledWith(
      '/api/education/question/list',
      { params: { pageNum: 1, pageSize: 1000 } },
    );
  });

  it('covers education query and lifecycle facades explicitly', async () => {
    requestMock.get.mockImplementation((url: string) =>
      url.includes('/chapter/textbook')
        ? Promise.resolve([])
        : Promise.resolve({
            items: [{ id: 1, name: 'Ada', code: 'MATH', studentNo: 'S1' }],
            total: 1,
          }),
    );
    const payload = {} as any;

    await getOverview(1);
    await getAbilityRadar(1, 2);
    await getWeakPoints(1);
    await getTrend(1);
    await getStudyRecords(1);
    await getStudyRecordsByKnowledge(1, 2);
    await createStudyRecord(payload);

    await getChapterById(1);
    await getChaptersByTextbook(2);
    await getChapterTree(2);
    await createChapter(payload);
    await updateChapter(1, payload);
    await deleteChapter(1);
    await getChapterKnowledgeIds(1);
    await replaceChapterKnowledgeIds(1, [2, 3]);
    await getChapterOptions(2);

    await getCourseList();
    await getCourseById(1);
    await getCourseBySubject('MATH');
    await getCourseByGrade(7);
    await createCourse(payload);
    await updateCourse(1, payload);
    await startLearning(1, 2);
    await deleteCourse(1);

    await getExamList();
    await getExamById(1);
    await getExamBySubject('MATH');
    await getExamByTeacher(2);
    await createExam(payload);
    await updateExam(1, payload);
    await deleteExam(1);
    await getAdminExamList();
    await getAdminExamById(1);
    await createAdminExam(payload);
    await deleteAdminExam(1);

    await getAllQuestions();
    await getQuestionById(1);
    await getQuestionBySubjectGrade('MATH', 7);
    await getQuestionByDifficulty(2);
    await getQuestionByType('SINGLE');
    await createQuestion(payload);
    await updateQuestion(1, payload);
    await deleteQuestion(1);
    await getQuestionOptions();

    await getPlanById(1);
    await getPlansByStudent(2);
    await getActivePlans(2);
    await getTodayTasks(2);
    await getReviewById(1);
    await getTodayReviews(2);
    await getReviewsByStatus(2, 1);
    await createReview(payload);
    await updateReview(1, payload);
    await deleteReview(1);
    await completeReview(1, payload);

    await getResourceList();
    await getResourceById(1);
    await getResourceBySubject('MATH');
    await getResourceByType('VIDEO');
    await createResource(payload);
    await updateResource(1, payload);
    await deleteResource(1);

    await getStudentList();
    await getStudentById(1);
    await createStudent(payload);
    await updateStudent(1, payload);
    await deleteStudent(1);
    await getStudentOptions();

    await getSubjectList();
    await getSubjectById(1);
    await getSubjectByCode('MATH');
    await getSubjectByGradeLevel('PRIMARY');
    await createSubject(payload);
    await updateSubject(1, payload);
    await deleteSubject(1);
    await getSubjectOptions();

    await getTextbookList();
    await getTextbookById(1);
    await getTextbookBySubjectAndGrade('MATH', 7);
    await createTextbook(payload);
    await updateTextbook(1, payload);
    await deleteTextbook(1);
    await getTextbookOptions();

    await getWrongQuestionById(1);
    await getWrongQuestionsByStudent(2);
    await createWrongQuestion(payload);
    await updateWrongQuestion(1, payload);
    await deleteWrongQuestion(1);
    await getChapterOptions();

    expect(requestMock.get).toHaveBeenCalled();
    expect(requestMock.post).toHaveBeenCalled();
  });
});

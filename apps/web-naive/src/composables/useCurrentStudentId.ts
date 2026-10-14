import { getCurrentStudent } from '#/features/education/api/student';

/** Resolve the current student through the authenticated server session. */
export function useCurrentStudentId() {
  async function getCurrentStudentId(): Promise<number> {
    const student = await getCurrentStudent();
    if (!Number.isSafeInteger(student?.id) || (student?.id ?? 0) <= 0) {
      throw new Error('当前账号未关联学生档案');
    }
    return student!.id;
  }

  return {
    getCurrentStudentId,
  };
}

import { useUserStore } from '@vben/stores';

function parseExtInfo(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  }
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function asStudentId(value: unknown): number | undefined {
  const normalized =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof normalized === 'number' &&
    Number.isSafeInteger(normalized) &&
    normalized > 0
    ? normalized
    : undefined;
}

/**
 * 获取当前登录用户的 studentId
 * 优先从 userInfo.extInfo.studentId 获取，如果没有则返回 1（开发环境默认值）
 */
export function useCurrentStudentId() {
  const userStore = useUserStore();

  function getCurrentStudentId(): number {
    // 尝试从 extInfo 中获取 studentId
    const extInfo = userStore.userInfo?.extInfo;
    if (extInfo) {
      const studentId = asStudentId(parseExtInfo(extInfo)?.studentId);
      if (studentId !== undefined) return studentId;
    }

    // 尝试从 userInfo 的其他字段获取
    const studentId = asStudentId(
      (userStore.userInfo as undefined | { studentId?: unknown })?.studentId,
    );
    if (studentId !== undefined) return studentId;

    // 开发环境默认值
    return 1;
  }

  return {
    getCurrentStudentId,
  };
}

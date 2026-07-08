import { useUserStore } from '@vben/stores';

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
      const parsed = typeof extInfo === 'string' ? JSON.parse(extInfo) : extInfo;
      if (parsed?.studentId != null) {
        return parsed.studentId;
      }
    }

    // 尝试从 userInfo 的其他字段获取
    if ((userStore.userInfo as any)?.studentId != null) {
      return (userStore.userInfo as any).studentId;
    }

    // 开发环境默认值
    return 1;
  }

  return {
    getCurrentStudentId,
  };
}

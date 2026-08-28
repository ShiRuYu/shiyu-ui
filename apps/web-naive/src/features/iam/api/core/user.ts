import type { UserInfo } from '@vben/types';

import { requestClient } from '#/shared/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/api/iam/users/detail');
}

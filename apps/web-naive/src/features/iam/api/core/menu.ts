import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/shared/api/request';

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/api/iam/menus/all');
}

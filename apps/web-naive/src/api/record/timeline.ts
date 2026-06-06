import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace TimelineApi {
  export interface TimelineEvent {
    [key: string]: any;
    createdBy?: number;
    eventTime: string;
    id: number;
    profileId: number;
    title: string;
    type: 'custom' | 'daily' | 'milestone';
    visibility?: 'family' | 'private' | 'public';
  }

  export interface PageResult<T> {
    items: T[];
    total: number;
  }
}

/**
 * 分页获取时间线事件
 */
async function getTimelinePage(params: Recordable<any>) {
  const { page = 1, pageSize = 20, ...rest } = params || {};
  return requestClient.get<TimelineApi.PageResult<TimelineApi.TimelineEvent>>(
    '/api/timeline/page',
    { params: { pageNo: page, pageSize, ...rest } },
  );
}

/**
 * 根据 ID 获取事件
 */
async function getTimelineById(id: number) {
  return requestClient.get<TimelineApi.TimelineEvent>(`/api/timeline/${id}`);
}

/**
 * 获取档案的完整时间线
 */
async function getTimelineByProfile(profileId: number) {
  return requestClient.get<TimelineApi.TimelineEvent[]>(
    `/api/timeline/profile/${profileId}`,
  );
}

/**
 * 创建时间线事件
 */
async function createTimeline(data: Omit<TimelineApi.TimelineEvent, 'id'>) {
  return requestClient.post<TimelineApi.TimelineEvent>('/api/timeline', data);
}

/**
 * 更新时间线事件
 */
async function updateTimeline(data: TimelineApi.TimelineEvent) {
  return requestClient.put<boolean>('/api/timeline', data);
}

/**
 * 删除时间线事件
 */
async function deleteTimeline(id: number) {
  return requestClient.delete<boolean>(`/api/timeline/${id}`);
}

export {
  createTimeline,
  deleteTimeline,
  getTimelineById,
  getTimelineByProfile,
  getTimelinePage,
  updateTimeline,
};

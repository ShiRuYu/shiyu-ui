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
    '/record/timeline/list',
    { params: { pageNum: page, pageSize, ...rest } },
  );
}

/**
 * 创建时间线事件
 */
async function createTimeline(data: Omit<TimelineApi.TimelineEvent, 'id'>) {
  return requestClient.post<TimelineApi.TimelineEvent>('/record/timeline/create', data);
}

/**
 * 更新时间线事件
 */
async function updateTimeline(data: TimelineApi.TimelineEvent) {
  return requestClient.post<boolean>('/record/timeline/update', data, { params: { id: data.id } });
}

/**
 * 删除时间线事件
 */
async function deleteTimeline(id: number) {
  return requestClient.post<boolean>('/record/timeline/delete', null, { params: { id } });
}

async function getTimelineOptions() {
  const result = await getTimelinePage({ page: 1, pageSize: 1000 });
  return (result?.items || []).map((e: any) => ({ id: e.id, title: e.title }));
}

export { createTimeline, deleteTimeline, getTimelineOptions, getTimelinePage, updateTimeline };

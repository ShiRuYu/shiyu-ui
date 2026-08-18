import { requestClient } from '#/api/request';

export interface UsageOverview {
  total_calls: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
  platform_count: number;
  model_count: number;
}

export interface DailyUsage {
  date: string;
  call_count: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
}

export interface ModelUsage {
  platform: string;
  model: string;
  call_count: number;
  total_tokens: number;
  total_cost: number;
  avg_latency_ms: number;
}

/**
 * 获取用量概览
 */
export async function getUsageOverviewApi() {
  return requestClient.get<UsageOverview>('/v1/usage/overview');
}

/**
 * 按日查询聚合用量
 */
export async function getDailyUsageApi(days = 7) {
  return requestClient.get<DailyUsage[]>('/v1/usage/daily', {
    params: { days },
  });
}

/**
 * 按周查询聚合用量
 */
export async function getWeeklyUsageApi(weeks = 4) {
  return requestClient.get<DailyUsage[]>('/v1/usage/weekly', {
    params: { weeks },
  });
}

/**
 * 按月查询聚合用量
 */
export async function getMonthlyUsageApi(months = 6) {
  return requestClient.get<DailyUsage[]>('/v1/usage/monthly', {
    params: { months },
  });
}

/**
 * 按模型查询聚合用量
 */
export async function getModelUsageApi() {
  return requestClient.get<ModelUsage[]>('/v1/usage/by-model');
}

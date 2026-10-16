import { requestClient } from '#/shared/api/request';

export interface UsageOverview {
  total_calls: number;
  total_tokens: number;
  total_cost: null | number;
  unknown_cost_calls: number;
  avg_latency_ms: number;
  platform_count: number;
  model_count: number;
}

export interface DailyUsage {
  date: string;
  call_count: number;
  total_tokens: number;
  total_cost: null | number;
  unknown_cost_calls: number;
  avg_latency_ms: number;
}

export interface ModelUsage {
  platform: string;
  model: string;
  call_count: number;
  total_tokens: number;
  total_cost: null | number;
  unknown_cost_calls: number;
  avg_latency_ms: number;
}

export function formatUsageCost(
  cost: null | number | undefined,
  unknownCalls = 0,
) {
  if (cost === null || cost === undefined) {
    return unknownCalls > 0 ? `未知（${unknownCalls} 次未计价）` : '未知';
  }
  return cost.toFixed(4);
}

/**
 * 获取用量概览
 */
export async function getUsageOverviewApi() {
  return requestClient.get<UsageOverview>('/api/governance/usage/overview');
}

/**
 * 按日查询聚合用量
 */
export async function getDailyUsageApi(days = 7) {
  return requestClient.get<DailyUsage[]>('/api/governance/usage/daily', {
    params: { days },
  });
}

/**
 * 按周查询聚合用量
 */
export async function getWeeklyUsageApi(weeks = 4) {
  return requestClient.get<DailyUsage[]>('/api/governance/usage/weekly', {
    params: { weeks },
  });
}

/**
 * 按月查询聚合用量
 */
export async function getMonthlyUsageApi(months = 6) {
  return requestClient.get<DailyUsage[]>('/api/governance/usage/monthly', {
    params: { months },
  });
}

/**
 * 按模型查询聚合用量
 */
export async function getModelUsageApi() {
  return requestClient.get<ModelUsage[]>('/api/governance/usage/by-model');
}

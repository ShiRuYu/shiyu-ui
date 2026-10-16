import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import {
  formatUsageCost,
  getDailyUsageApi,
  getModelUsageApi,
  getMonthlyUsageApi,
  getUsageOverviewApi,
  getWeeklyUsageApi,
} from '../usage';

describe('governance usage facade', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses stable governance paths and default aggregation windows', async () => {
    requestMock.get.mockResolvedValue([]);
    await getUsageOverviewApi();
    await getDailyUsageApi();
    await getWeeklyUsageApi(2);
    await getMonthlyUsageApi();
    await getModelUsageApi();

    expect(requestMock.get).toHaveBeenNthCalledWith(
      1,
      '/api/governance/usage/overview',
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      2,
      '/api/governance/usage/daily',
      { params: { days: 7 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      3,
      '/api/governance/usage/weekly',
      { params: { weeks: 2 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      4,
      '/api/governance/usage/monthly',
      { params: { months: 6 } },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      5,
      '/api/governance/usage/by-model',
    );
  });

  it('formats missing model prices as unknown and known prices as amounts', () => {
    expect(formatUsageCost(null, 2)).toBe('未知（2 次未计价）');
    expect(formatUsageCost(undefined)).toBe('未知');
    expect(formatUsageCost(0)).toBe('0.0000');
  });
});

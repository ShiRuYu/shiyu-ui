import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import {
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
});

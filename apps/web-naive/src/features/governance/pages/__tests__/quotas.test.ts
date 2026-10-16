import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const usageMock = vi.hoisted(() => ({
  getDailyUsageApi: vi.fn(),
  getUsageOverviewApi: vi.fn(),
}));

vi.mock('#/features/governance', () => ({
  ...usageMock,
  formatUsageCost: (cost: null | number | undefined, unknownCalls = 0) => {
    if (cost === null || cost === undefined) {
      return unknownCalls > 0 ? `未知（${unknownCalls} 次未计价）` : '未知';
    }
    return cost.toFixed(4);
  },
}));
vi.mock('#/shared', () => ({
  PlatformWorkspaceShell: {
    props: ['metrics'],
    template:
      '<main><div v-for="metric in metrics">{{ metric.label }}: {{ metric.value }}</div><slot /><slot name="side" /></main>',
  },
}));
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import QuotasPage from '../quotas.vue';

describe('governance quota costs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usageMock.getUsageOverviewApi.mockResolvedValue({
      total_calls: 1,
      total_tokens: 7,
      total_cost: null,
      unknown_cost_calls: 1,
      avg_latency_ms: 20,
      platform_count: 1,
      model_count: 1,
    });
    usageMock.getDailyUsageApi.mockResolvedValue([
      {
        date: '2026-10-16',
        call_count: 1,
        total_tokens: 7,
        total_cost: null,
        unknown_cost_calls: 1,
        avg_latency_ms: 20,
      },
    ]);
  });

  it('shows unknown cost instead of zero when the API reports unpriced calls', async () => {
    const wrapper = mount(QuotasPage, {
      global: {
        stubs: {
          NAlert: { template: '<div><slot /></div>' },
          NButton: { template: '<button><slot /></button>' },
          NCard: { template: '<section><slot /></section>' },
          NEmpty: { template: '<div><slot /></div>' },
          NList: { template: '<div><slot /></div>' },
          NListItem: { template: '<div><slot /></div>' },
          NSpace: { template: '<div><slot /></div>' },
          NSpin: { template: '<div><slot /></div>' },
          NStatistic: {
            props: ['label', 'value'],
            template: '<div>{{ label }}: {{ value }}</div>',
          },
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('未知');
    expect(wrapper.text()).toContain('1 次未计价');
    expect(wrapper.text()).not.toContain('0.0000');
  });
});

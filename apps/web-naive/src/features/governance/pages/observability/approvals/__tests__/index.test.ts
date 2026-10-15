import { flushPromises, mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  approveAndResumeTool: vi.fn(),
  confirmClaimedToolNotExecuted: vi.fn(),
  confirmClaimedToolSuccess: vi.fn(),
  listRuntimeApprovals: vi.fn(),
  rejectAndCancelTool: vi.fn(),
}));

vi.mock('#/features/agent', () => api);
vi.mock('#/shared', () => ({
  PlatformWorkspaceShell: { template: '<main><slot /></main>' },
}));

import ApprovalsPage from '../index.vue';

const slotStub = { template: '<div><slot /></div>' };

describe('tool approval review details', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the redacted action arguments before approval', async () => {
    api.listRuntimeApprovals.mockResolvedValue([
      {
        id: 'approval-1',
        runId: 'run-1',
        toolName: 'filesystem.write',
        status: 'PENDING',
        argumentsRedacted: JSON.stringify({
          summary: JSON.stringify({
            path: '/tmp/file.txt',
            apiKey: '[redacted]',
          }),
          argumentsSha256: 'hash',
        }),
      },
    ]);

    const wrapper = mount(ApprovalsPage, {
      global: {
        stubs: {
          NAlert: slotStub,
          NButton: slotStub,
          NEmpty: slotStub,
          NList: slotStub,
          NListItem: slotStub,
          NPopconfirm: slotStub,
          NSpace: slotStub,
          NTag: slotStub,
        },
      },
    });
    await flushPromises();

    expect(wrapper.text()).toContain('/tmp/file.txt');
    expect(wrapper.text()).toContain('[redacted]');
    wrapper.unmount();
  });
});

import { flushPromises, shallowMount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  createSpace: vi.fn(),
  deleteSpace: vi.fn(),
  getKnowledgeDomainLabel: vi.fn(),
  getSpaceMembers: vi.fn(),
  getSpaces: vi.fn(),
  replaceSpaceMembers: vi.fn(),
  updateSpace: vi.fn(),
}));

vi.mock('#/features/knowledge/api', () => api);
vi.mock('#/adapter/naive', () => ({ dialog: { warning: vi.fn() } }));
vi.mock('#/store', () => ({
  useKnowledgeStore: () => ({
    loadSpaces: vi.fn(),
    setActiveSpace: vi.fn(),
  }),
}));
vi.mock('@vben/common-ui', () => ({
  Page: { template: '<div><slot /></div>' },
}));
vi.mock('naive-ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('naive-ui')>()),
  useMessage: () => ({ error: vi.fn(), success: vi.fn(), warning: vi.fn() }),
}));

import SpacesPage from './index.vue';

interface ViewModel {
  open: (space: { id: number }) => Promise<void>;
  save: () => Promise<void>;
}

describe('knowledge space membership safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getSpaces.mockResolvedValue({ items: [], total: 0 });
    api.updateSpace.mockResolvedValue({ id: 7 });
    api.replaceSpaceMembers.mockResolvedValue(undefined);
  });

  it('does not overwrite membership while its existing members are still loading', async () => {
    let resolve!: (members: never[]) => void;
    api.getSpaceMembers.mockReturnValue(
      new Promise<never[]>((done) => {
        resolve = done;
      }),
    );
    const wrapper = shallowMount(SpacesPage);
    const view = wrapper.vm as unknown as ViewModel;
    const opening = view.open({ id: 7 });

    await view.save();
    expect(api.replaceSpaceMembers).not.toHaveBeenCalled();
    expect(api.updateSpace).not.toHaveBeenCalled();

    resolve([]);
    await opening;
    wrapper.unmount();
  });

  it('does not replace members with an empty list after loading them fails', async () => {
    api.getSpaceMembers.mockRejectedValue(new Error('Unavailable'));
    const wrapper = shallowMount(SpacesPage);
    const view = wrapper.vm as unknown as ViewModel;
    await view.open({ id: 7 });
    await flushPromises();

    await view.save();
    expect(api.replaceSpaceMembers).not.toHaveBeenCalled();
    expect(api.updateSpace).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('preserves loaded members when saving space settings', async () => {
    const members = [
      { principalId: 12, principalType: 'USER', spaceRole: 'EDITOR' },
    ];
    api.getSpaceMembers.mockResolvedValue(members);
    const wrapper = shallowMount(SpacesPage);
    const view = wrapper.vm as unknown as ViewModel;
    await view.open({ id: 7 });

    await view.save();
    expect(api.replaceSpaceMembers).toHaveBeenCalledWith(7, members);
    wrapper.unmount();
  });
});

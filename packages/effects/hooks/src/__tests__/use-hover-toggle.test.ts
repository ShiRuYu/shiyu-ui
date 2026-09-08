import { nextTick, ref } from 'vue';

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useElementHover: vi.fn(() => ({ value: false })),
}));

vi.mock('@vueuse/core', async () => {
  const actual =
    await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core');
  return { ...actual, useElementHover: mocks.useElementHover };
});

import { useHoverToggle } from '../use-hover-toggle';

describe('useHoverToggle', () => {
  it('rebinds hover listeners when same-sized element arrays replace nodes', async () => {
    const first = document.createElement('button');
    const second = document.createElement('button');
    const elements = ref<HTMLElement[]>([first, second]);

    useHoverToggle(elements);
    expect(mocks.useElementHover).toHaveBeenCalledTimes(2);

    elements.value = [second, first];
    await nextTick();

    expect(mocks.useElementHover).toHaveBeenCalledTimes(4);
  });
});

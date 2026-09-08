import { createApp, defineComponent } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';

const popup = vi.hoisted(() => ({
  open: vi.fn(),
  close: vi.fn(),
}));

vi.mock('@vben/locales', () => ({
  $t: (key: string) => key,
}));

vi.mock('@vben-core/popup-ui', () => ({
  useVbenModal: () => [defineComponent({ template: '<div />' }), popup],
}));

import CheckUpdates from '../check-updates.vue';

describe('CheckUpdates', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('does not restart polling when an in-flight check resolves after unmount', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('location', { hostname: 'example.test' });
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');
    let resolveFetch:
      | ((response: { headers: { get: () => string } }) => void)
      | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve;
          }),
      ),
    );

    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(CheckUpdates, {
      checkUpdatesInterval: 1,
      checkUpdateUrl: '/version',
    });
    app.mount(host);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetch).toHaveBeenCalledTimes(1);
    app.unmount();
    resolveFetch?.({ headers: { get: () => 'v2' } });
    await Promise.resolve();
    await Promise.resolve();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('does not open the update notice when a changed version resolves after unmount', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('location', { hostname: 'example.test' });
    const resolvers: Array<
      (response: { headers: { get: () => string } }) => void
    > = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }),
      ),
    );

    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp(CheckUpdates, {
      checkUpdatesInterval: 1,
      checkUpdateUrl: '/version',
    });
    app.mount(host);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event('visibilitychange'));
    resolvers.shift()?.({ headers: { get: () => 'v1' } });
    await Promise.resolve();
    await Promise.resolve();

    document.dispatchEvent(new Event('visibilitychange'));
    expect(fetch).toHaveBeenCalledTimes(2);
    app.unmount();
    resolvers.shift()?.({ headers: { get: () => 'v2' } });
    await Promise.resolve();
    await Promise.resolve();

    expect(popup.open).not.toHaveBeenCalled();
  });
});

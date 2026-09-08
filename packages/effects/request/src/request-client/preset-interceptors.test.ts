import type { RequestClient } from './request-client';

import { describe, expect, it, vi } from 'vitest';

import {
  authenticateResponseInterceptor,
  errorMessageResponseInterceptor,
} from './preset-interceptors';

function createClient() {
  return {
    isRefreshing: false,
    refreshTokenQueue: [],
    request: vi.fn(),
  } as unknown as RequestClient;
}

function createAuthInterceptor(doReAuthenticate = vi.fn()) {
  return {
    doReAuthenticate,
    interceptor: authenticateResponseInterceptor({
      client: createClient(),
      doReAuthenticate,
      doRefreshToken: vi.fn(),
      enableRefreshToken: false,
      formatToken: (token) => `Bearer ${token}`,
    }),
  };
}

describe('authentication response handling', () => {
  it('redirects an expired authenticated request once and suppresses its toast', async () => {
    const { doReAuthenticate, interceptor } = createAuthInterceptor();
    const error = {
      config: { headers: { Authorization: 'Bearer expired' } },
      response: { data: { code: 401 }, status: 401 },
    } as any;

    await expect(interceptor.rejected?.(error)).rejects.toBe(error);
    expect(doReAuthenticate).toHaveBeenCalledOnce();
    expect(error.__handledByAuth).toBe(true);

    const showMessage = vi.fn();
    const messageInterceptor = errorMessageResponseInterceptor(showMessage);
    await expect(messageInterceptor.rejected?.(error)).rejects.toBe(error);
    expect(showMessage).not.toHaveBeenCalled();
  });

  it('keeps feedback for an unauthorized public request such as sign in', async () => {
    const { doReAuthenticate, interceptor } = createAuthInterceptor();
    const error = {
      config: { headers: {} },
      response: { data: { code: 401 }, status: 401 },
    } as any;

    await expect(interceptor.rejected?.(error)).rejects.toBe(error);
    expect(doReAuthenticate).not.toHaveBeenCalled();

    const showMessage = vi.fn();
    const messageInterceptor = errorMessageResponseInterceptor(showMessage);
    await expect(messageInterceptor.rejected?.(error)).rejects.toBe(error);
    expect(showMessage).toHaveBeenCalledOnce();
  });

  it('rejects queued requests when the shared token refresh fails', async () => {
    const client = createClient();
    const doReAuthenticate = vi.fn().mockResolvedValue(undefined);
    let rejectRefresh!: (reason: unknown) => void;
    const refreshFailure = new Error('refresh failed');
    const interceptor = authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken: () =>
        new Promise<string>((_resolve, reject) => {
          rejectRefresh = reject;
        }),
      enableRefreshToken: true,
      formatToken: (token) => `Bearer ${token}`,
    });
    const error = (url: string) =>
      ({
        config: { url, headers: { Authorization: 'Bearer expired' } },
        response: { data: { code: 401 }, status: 401 },
      }) as any;

    const refreshing = interceptor.rejected?.(error('/first'));
    const queued = interceptor.rejected?.(error('/second'));
    rejectRefresh(refreshFailure);

    await expect(refreshing).rejects.toBe(refreshFailure);
    await expect(queued).rejects.toBe(refreshFailure);
    expect(client.request).not.toHaveBeenCalled();
    expect(doReAuthenticate).toHaveBeenCalledOnce();
  });

  it('marks queued requests as one-time retries after refresh succeeds', async () => {
    const client = createClient();
    client.request.mockResolvedValue('retried');
    const interceptor = authenticateResponseInterceptor({
      client,
      doReAuthenticate: vi.fn(),
      doRefreshToken: vi.fn().mockResolvedValue('fresh-token'),
      enableRefreshToken: true,
      formatToken: (token) => `Bearer ${token}`,
    });
    const error = (url: string) =>
      ({
        config: { url, headers: { Authorization: 'Bearer expired' } },
        response: { data: { code: 401 }, status: 401 },
      }) as any;

    await Promise.all([
      interceptor.rejected?.(error('/first')),
      interceptor.rejected?.(error('/second')),
    ]);

    expect(client.request).toHaveBeenCalledWith(
      '/second',
      expect.objectContaining({
        __isRetryRequest: true,
        headers: expect.objectContaining({
          Authorization: 'Bearer fresh-token',
        }),
      }),
    );
  });

  it('retries the request that refreshed the token with the fresh token', async () => {
    const client = createClient();
    client.request.mockResolvedValue('retried');
    const interceptor = authenticateResponseInterceptor({
      client,
      doReAuthenticate: vi.fn(),
      doRefreshToken: vi.fn().mockResolvedValue('fresh-token'),
      enableRefreshToken: true,
      formatToken: (token) => `Bearer ${token}`,
    });
    const error = {
      config: { url: '/first', headers: { Authorization: 'Bearer expired' } },
      response: { data: { code: 401 }, status: 401 },
    } as any;

    await interceptor.rejected?.(error);

    expect(client.request).toHaveBeenCalledWith(
      '/first',
      expect.objectContaining({
        __isRetryRequest: true,
        headers: expect.objectContaining({
          Authorization: 'Bearer fresh-token',
        }),
      }),
    );
  });
});

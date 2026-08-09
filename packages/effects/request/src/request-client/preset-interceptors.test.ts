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
});

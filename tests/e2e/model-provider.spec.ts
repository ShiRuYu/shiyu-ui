import { expect, test } from 'playwright/test';

test('completes a real provider generation and persists its assistant message', async ({
  page,
}) => {
  test.skip(
    !process.env.E2E_MODEL_PROVIDER,
    'Requires an explicitly configured real provider',
  );
  test.setTimeout(120_000);
  await page.goto('/auth/login');
  await page.locator('input').nth(0).fill(process.env.E2E_USERNAME!);
  await page.locator('input').nth(1).fill(process.env.E2E_PASSWORD!);
  const response = page.waitForResponse('**/api/iam/auth/login');
  await page.getByRole('button', { name: 'login', exact: true }).click();
  const login = await (await response).json();
  expect(login.code).toBe(200);
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };
  const model = {
    platform: process.env.E2E_MODEL_PROVIDER,
    model: process.env.E2E_MODEL_NAME,
  };
  const created = await (
    await page.request.post('/api/conversation/conversations', {
      headers,
      data: { ...model, sceneType: 'chat', title: 'Real provider regression' },
    })
  ).json();
  expect(created.code).toBe(200);
  const id = created.data.id;
  const generated = await (
    await page.request.post(
      `/api/conversation/conversations/${id}/generations`,
      {
        headers,
        data: { ...model, content: 'Reply with a short greeting.' },
      },
    )
  ).json();
  expect(generated.code).toBe(200);
  const stream = await page.request.get(
    `/api/conversation/generations/${generated.data.id}/events?follow=true&waitMs=90000`,
    {
      headers,
      timeout: 100_000,
    },
  );
  expect(stream.headers()['content-type']).toContain('text/event-stream');
  const text = await stream.text();
  expect(text).toContain('event:COMPLETED');
  expect(text).not.toContain('event:FAILED');
  const messages = await (
    await page.request.get(`/api/conversation/conversations/${id}/messages`, {
      headers,
    })
  ).json();
  expect(messages.code).toBe(200);
  const assistant = messages.data.find(
    (message: { role: string }) => message.role === 'ASSISTANT',
  );
  expect(assistant.generationId).toBe(generated.data.id);
  expect(assistant.status).toBe('COMPLETED');
  expect(
    assistant.contentParts.some((part: { text?: string }) => part.text?.trim()),
  ).toBeTruthy();
});

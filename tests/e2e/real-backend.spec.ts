import { Buffer } from 'node:buffer';

import { expect, test } from 'playwright/test';

test('persists an App and publishes its Agent version through the real backend', async ({
  page,
}) => {
  test.setTimeout(60_000);
  const name = `real-journey-${Date.now()}`;
  await page.goto('/auth/login');
  await page.locator('input').nth(0).fill(process.env.E2E_USERNAME!);
  await page.locator('input').nth(1).fill(process.env.E2E_PASSWORD!);
  const loginResponse = page.waitForResponse('**/api/iam/auth/login');
  await page.getByRole('button', { name: 'login', exact: true }).click();
  const login = await (await loginResponse).json();
  expect(login.code).toBe(200);
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };
  await expect(page).not.toHaveURL(/\/auth\/login/);
  await page.goto('/app-studio/apps/edit?new=true');
  await page.getByPlaceholder('例如：企业知识助手').fill(name);
  const createdResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/agent/apps') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '创建并发布', exact: true }).click();
  const created = await (await createdResponse).json();
  expect(created.code).toBe(200);
  await expect(page).toHaveURL(/\/app-studio\/apps$/, { timeout: 15_000 });
  await page.reload();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  const versionsResponse = await page.request.get(
    `/api/agent/apps/${created.data.id}/versions`,
    { headers },
  );
  const versions = await versionsResponse.json();
  expect(versions.code).toBe(200);
  expect(versions.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ version: '0.1.0', status: 'PUBLISHED' }),
    ]),
  );
});

for (const config of ['null', '[]', '"text"', '1', 'true']) {
  test(`rejects ${config} App configuration before creating server records`, async ({
    page,
  }) => {
    await page.goto('/auth/login');
    await page.locator('input').nth(0).fill(process.env.E2E_USERNAME!);
    await page.locator('input').nth(1).fill(process.env.E2E_PASSWORD!);
    await page.getByRole('button', { name: 'login', exact: true }).click();
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await page.goto('/app-studio/apps/edit?new=true');
    await page
      .getByPlaceholder('例如：企业知识助手')
      .fill(`invalid-config-${Date.now()}`);
    await page
      .getByPlaceholder('{"executionType":"AGENT","agentId":"..."}')
      .fill(config);
    const creates: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        request.url().endsWith('/api/agent/apps')
      )
        creates.push(request.url());
    });
    await page.getByRole('button', { name: '保存草稿', exact: true }).click();
    await expect(
      page.getByText('配置 JSON 必须是对象', { exact: true }),
    ).toBeVisible();
    expect(creates).toEqual([]);
  });
}

test('creates a knowledge space, stores a document and reloads its content', async ({
  page,
}) => {
  test.setTimeout(90_000);
  await page.goto('/auth/login');
  await page.locator('input').nth(0).fill(process.env.E2E_USERNAME!);
  await page.locator('input').nth(1).fill(process.env.E2E_PASSWORD!);
  const loginResponse = page.waitForResponse('**/api/iam/auth/login');
  await page.getByRole('button', { name: 'login', exact: true }).click();
  const login = await (await loginResponse).json();
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };
  await expect(page).not.toHaveURL(/\/auth\/login/);
  const name = `knowledge-${Date.now()}`;
  await page.goto('/knowledge-center/spaces');
  await page.getByRole('button', { name: '新建空间', exact: true }).click();
  await page.getByPlaceholder('例如 product_docs').fill(name);
  await page.getByPlaceholder('便于团队识别的名称').fill(name);
  const savedResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/knowledge/spaces') &&
      response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const saved = await (await savedResponse).json();
  expect(saved.code).toBe(200);
  await page.reload();
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  const content = `ShiYu real journey ${name}: knowledge survives a reload.`;
  const upload = await page.request.post(
    `/api/knowledge/spaces/${saved.data.id}/documents`,
    {
      headers,
      multipart: {
        file: {
          name: `${name}.txt`,
          mimeType: 'text/plain',
          buffer: Buffer.from(content),
        },
      },
    },
  );
  const uploaded = await upload.json();
  expect(uploaded.code).toBe(200);
  expect(uploaded.data.document.id).toBeTruthy();
  expect(uploaded.data.jobId).toBeTruthy();
  await expect
    .poll(
      async () => {
        const response = await page.request.get(
          `/api/knowledge/ingestion-jobs?spaceId=${saved.data.id}&pageNum=1&pageSize=10`,
          { headers },
        );
        const jobs = await response.json();
        expect(jobs.code).toBe(200);
        return jobs.data.items.find(
          (job: { id: number }) => job.id === uploaded.data.jobId,
        )?.status;
      },
      { timeout: 60_000, intervals: [1000, 2000] },
    )
    .toBe('SUCCEEDED');
  const preview = await page.request.get(
    `/api/knowledge/documents/${uploaded.data.document.id}/preview`,
    { headers },
  );
  expect(preview.ok()).toBeTruthy();
  expect(await preview.text()).toContain(content);
  const published = await (
    await page.request.post(
      `/api/knowledge/documents/${uploaded.data.document.id}/publish`,
      { headers },
    )
  ).json();
  expect(published.code).toBe(200);
  await expect
    .poll(
      async () => {
        const result = await (
          await page.request.post('/api/knowledge/search', {
            headers,
            data: {
              spaceId: saved.data.id,
              query: name,
              topK: 5,
              rerank: false,
            },
          })
        ).json();
        expect(result.code).toBe(200);
        return result.data.hits.some(
          (hit: { documentId: number }) =>
            hit.documentId === uploaded.data.document.id,
        );
      },
      { timeout: 30_000 },
    )
    .toBe(true);
  const list = await page.request.get(
    `/api/knowledge/spaces/${saved.data.id}/documents?pageNum=1&pageSize=10`,
    { headers },
  );
  const listed = await list.json();
  expect(listed.code).toBe(200);
  expect(listed.data.items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: uploaded.data.document.id }),
    ]),
  );
});

test('persists conversations idempotently and records a real failed generation', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/auth/login');
  await page.locator('input').nth(0).fill(process.env.E2E_USERNAME!);
  await page.locator('input').nth(1).fill(process.env.E2E_PASSWORD!);
  const loginResponse = page.waitForResponse('**/api/iam/auth/login');
  await page.getByRole('button', { name: 'login', exact: true }).click();
  const login = await (await loginResponse).json();
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };
  const idempotency = {
    ...headers,
    'Idempotency-Key': `conversation-${Date.now()}`,
  };
  const data = {
    sceneType: 'chat',
    title: 'real conversation',
    platform: '__missing_e2e__',
    model: '__missing_e2e__',
  };
  const create = async () =>
    (
      await page.request.post('/api/conversation/conversations', {
        headers: idempotency,
        data,
      })
    ).json();
  const first = await create();
  expect(first.code).toBe(200);
  const second = await create();
  expect(second.code).toBe(200);
  expect(second.data.id).toBe(first.data.id);
  const id = first.data.id;
  const generation = await page.request.post(
    `/api/conversation/conversations/${id}/generations`,
    {
      headers,
      data: {
        content: 'real persisted message',
        platform: '__missing_e2e__',
        model: '__missing_e2e__',
      },
    },
  );
  const generated = await generation.json();
  expect(generated.code).toBe(200);
  const events = await page.request.get(
    `/api/conversation/generations/${generated.data.id}/events?afterSeq=-1&follow=true&waitMs=10000`,
    { headers },
  );
  expect(events.ok()).toBeTruthy();
  const stream = await events.text();
  expect(stream).toContain('FAILED');
  const messages = await (
    await page.request.get(`/api/conversation/conversations/${id}/messages`, {
      headers,
    })
  ).json();
  expect(messages.code).toBe(200);
  expect(JSON.stringify(messages.data)).toContain('real persisted message');
  const deleted = await (
    await page.request.delete(`/api/conversation/conversations/${id}`, {
      headers,
    })
  ).json();
  expect(deleted.code).toBe(200);
});

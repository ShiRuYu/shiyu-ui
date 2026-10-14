import { expect, test } from 'playwright/test';

/** Exercises a real Agent conversation failure without calling a model provider. */
test('persists an Agent failure across reload and retries the owned input', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password)
    throw new Error('E2E_USERNAME and E2E_PASSWORD are required');

  await page.goto('/auth/login');
  await page.locator('input').nth(0).fill(username);
  await page.locator('input').nth(1).fill(password);
  const loginResponse = page.waitForResponse('**/api/iam/auth/login');
  await page.getByRole('button', { name: 'login', exact: true }).click();
  const login = await (await loginResponse).json();
  expect(login.code).toBe(200);
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };
  const appName = `Agent failure E2E ${Date.now()}`;
  const app = await (
    await page.request.post('/api/agent/apps', {
      headers,
      data: {
        name: appName,
        description: 'Provider-free failure recovery test',
      },
    })
  ).json();
  expect(app.code).toBe(200);
  const version = await (
    await page.request.post(`/api/agent/apps/${app.data.id}/versions`, {
      headers,
      data: {
        version: '0.1.0',
        configJson: JSON.stringify({
          executionType: 'AGENT',
          agentId: 'simple-assistant',
          agentVersion: 'v1.0.0',
          validation: { graph: 'PASS' },
        }),
      },
    })
  ).json();
  expect(version.code).toBe(200);
  const publication = await (
    await page.request.post(
      `/api/agent/apps/${app.data.id}/versions/${version.data.id}/publish`,
      { headers },
    )
  ).json();
  expect(publication.code).toBe(200);

  // The disposable H2 seed gives simple-assistant ID 4. Disable it after
  // publishing so execution fails before any model provider is reached.
  const statusUrl = '/api/agent/agents/status?id=4&status=';
  const disabled = await (
    await page.request.post(`${statusUrl}0`, { headers })
  ).json();
  expect(disabled.code).toBe(200);
  try {
    await page.goto('/workspace/chat');
    await page.getByLabel('工作区模式').click();
    await page.getByText('Agent 执行', { exact: true }).last().click();
    await page.getByLabel('AI 应用').click();
    await page.getByText(appName, { exact: true }).last().click();
    const prompt = `provider-free failure ${Date.now()}`;
    await page.getByPlaceholder(/输入你的问题|Ask a question/).fill(prompt);
    const conversationResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/conversation/conversations') &&
        response.request().method() === 'POST',
    );
    const executionResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/agent-executions') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: /发送|Send/ }).click();
    const created = await (await conversationResponse).json();
    expect(created.code).toBe(200);
    expect((await executionResponse).status()).toBe(409);
    const conversationId = created.data.id as string;
    await expect(page.getByRole('log')).toContainText('对话请求失败，请重试');

    const readMessages = async () =>
      (
        await (
          await page.request.get(
            `/api/conversation/conversations/${conversationId}/messages`,
            { headers },
          )
        ).json()
      ).data as Array<{
        id: string;
        role: string;
        toolCall?: { status?: string };
      }>;
    await expect.poll(async () => (await readMessages()).length).toBe(2);
    const firstMessages = await readMessages();
    const input = firstMessages.find((item) => item.role === 'USER');
    expect(input?.id).toBeTruthy();
    expect(
      firstMessages.find((item) => item.role === 'ASSISTANT')?.toolCall?.status,
    ).toBe('FAILED');

    await page.reload();
    if (testInfo.project.name === 'mobile-chromium') {
      await page.getByRole('button', { name: '会话', exact: true }).click();
      await page
        .locator('.n-drawer')
        .getByText(prompt, { exact: true })
        .click();
    } else {
      await page.getByText(prompt, { exact: true }).last().click();
    }
    await expect(page.getByRole('log')).toContainText('Agent 执行失败');
    await expect(page.getByRole('button', { name: '重新生成' })).toBeVisible();
    const retriedRequest = page.waitForRequest(
      (request) =>
        request
          .url()
          .endsWith(
            `/api/conversation/conversations/${conversationId}/agent-executions`,
          ) && request.method() === 'POST',
    );
    await page.getByRole('button', { name: '重新生成' }).click();
    expect((await retriedRequest).postDataJSON()).toMatchObject({
      appId: app.data.id,
      prompt,
      sourceMessageId: input?.id,
    });
    await expect
      .poll(
        async () =>
          (await readMessages()).filter(
            (item) =>
              item.role === 'ASSISTANT' && item.toolCall?.status === 'FAILED',
          ).length,
      )
      .toBeGreaterThanOrEqual(2);
  } finally {
    const restored = await (
      await page.request.post(`${statusUrl}1`, { headers })
    ).json();
    expect(restored.code).toBe(200);
  }
});

import type { AddressInfo } from 'node:net';

import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';

import { expect, test } from 'playwright/test';

/**
 * Requires a disposable seeded H2 backend with tenant 1. Updates platform 4
 * with a local model endpoint and restores it when the test finishes.
 */
test('cancels stopped, closed-tab, and abruptly disconnected Agent runs', async ({
  page,
}) => {
  test.setTimeout(120_000);
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password)
    throw new Error('E2E_USERNAME and E2E_PASSWORD are required');
  const backendUrl = process.env.E2E_BACKEND_URL ?? 'http://127.0.0.1:19000';

  let releaseModel!: () => void;
  const modelGate = new Promise<void>((resolve) => {
    releaseModel = resolve;
  });
  let modelFinished!: () => void;
  const modelResponse = new Promise<void>((resolve) => {
    modelFinished = resolve;
  });
  let modelCalls = 0;
  const model = createServer(async (request, response) => {
    if (
      request.method !== 'POST' ||
      !request.url?.endsWith('/chat/completions')
    ) {
      response.writeHead(404).end();
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      stream?: boolean;
    };
    modelCalls += 1;
    await modelGate;
    if (response.destroyed) {
      modelFinished();
      return;
    }
    response.once('finish', modelFinished);
    response.once('close', modelFinished);
    if (body.stream) {
      response.writeHead(200, { 'Content-Type': 'text/event-stream' });
      response.end(
        'data: {"choices":[{"delta":{"content":"late answer"}}]}\n\n' +
          'data: {"choices":[{"finish_reason":"stop","delta":{}}]}\n\n' +
          'data: [DONE]\n\n',
      );
    } else {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(
        JSON.stringify({
          id: 'local-late-model',
          object: 'chat.completion',
          created: 1,
          model: 'Qwen/Qwen3-8B',
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { role: 'assistant', content: 'late answer' },
            },
          ],
        }),
      );
    }
  });
  await new Promise<void>((resolve) => model.listen(0, '127.0.0.1', resolve));
  const port = (model.address() as AddressInfo).port;

  let headers: Record<string, string> | undefined;
  try {
    await page.goto('/auth/login');
    await page.locator('input').nth(0).fill(username);
    await page.locator('input').nth(1).fill(password);
    const loginResponse = page.waitForResponse('**/api/iam/auth/login');
    await page.getByRole('button', { name: /^(login|登录)$/i }).click();
    const login = await (await loginResponse).json();
    expect(login.code).toBe(200);
    headers = { Authorization: `Bearer ${login.data.accessToken}` };
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.count()) await passwordInput.fill('');

    const platformUpdate = await (
      await page.request.put('/api/model/platforms/4', {
        headers,
        data: {
          name: '硅基流动（通义千问）',
          code: 'SILICON_FLOW',
          adapterType: 'OPENAI_COMPATIBLE',
          baseUrl: `http://127.0.0.1:${port}/v1`,
          apiKey: 'local-test-key',
          status: '1',
          maxRetries: 0,
        },
      })
    ).json();
    expect(platformUpdate.code).toBe(200);

    const appName = `Agent cancel E2E ${Date.now()}`;
    const app = await (
      await page.request.post('/api/agent/apps', {
        headers,
        data: {
          name: appName,
          description: 'Delayed local model cancellation test',
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

    await page.goto('/workspace/chat');
    await page.getByLabel('工作区模式').click();
    await page.getByText('Agent 执行', { exact: true }).last().click();
    await page.getByLabel('AI 应用').click();
    await page.getByText(appName, { exact: true }).last().click();
    await page
      .getByPlaceholder(/输入你的问题|Ask a question/)
      .fill('cancel the delayed model');
    await page.getByRole('button', { name: /发送|Send/ }).click();
    await expect.poll(() => modelCalls, { timeout: 30_000 }).toBeGreaterThan(0);

    const otherTab = await page.context().newPage();
    await otherTab.goto('/workspace/chat');
    await otherTab.getByLabel('工作区模式').click();
    await otherTab.getByText('Agent 执行', { exact: true }).last().click();
    await otherTab.getByLabel('AI 应用').click();
    await otherTab.getByText(appName, { exact: true }).last().click();
    await otherTab
      .getByPlaceholder(/输入你的问题|Ask a question/)
      .fill('let this tab finish');
    await otherTab.getByRole('button', { name: /发送|Send/ }).click();
    await expect.poll(() => modelCalls, { timeout: 30_000 }).toBe(2);

    const disconnectedTab = await page.context().newPage();
    await disconnectedTab.goto('/workspace/chat');
    await disconnectedTab.getByLabel('工作区模式').click();
    await disconnectedTab
      .getByText('Agent 执行', { exact: true })
      .last()
      .click();
    await disconnectedTab.getByLabel('AI 应用').click();
    await disconnectedTab.getByText(appName, { exact: true }).last().click();
    await disconnectedTab
      .getByPlaceholder(/输入你的问题|Ask a question/)
      .fill('disconnect this tab');
    await disconnectedTab.getByRole('button', { name: /发送|Send/ }).click();
    await expect.poll(() => modelCalls, { timeout: 30_000 }).toBe(3);
    const disconnectCancelRequest = disconnectedTab.waitForRequest((request) =>
      /\/api\/agent\/runs\/[^/]+\/cancel$/.test(request.url()),
    );
    await disconnectedTab.close();
    const disconnectedRunId = (await disconnectCancelRequest)
      .url()
      .match(/\/runs\/([^/]+)\/cancel$/)?.[1];
    expect(disconnectedRunId).toBeTruthy();
    await expect
      .poll(async () => {
        const run = await (
          await page.request.get(`/api/agent/runs/${disconnectedRunId}`, {
            headers,
          })
        ).json();
        return run.data?.status;
      })
      .toBe('CANCELLED');

    const directConversation = await (
      await page.request.post('/api/conversation/conversations', {
        headers,
        data: { sceneType: 'agent' },
      })
    ).json();
    expect(directConversation.code).toBe(200);
    const directController = new AbortController();
    const directResponse = await fetch(
      `${backendUrl}/api/conversation/conversations/${directConversation.data.id}/agent-executions`,
      {
        method: 'POST',
        headers: {
          ...headers,
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: app.data.id,
          prompt: 'abrupt network disconnect',
        }),
        signal: directController.signal,
      },
    );
    expect(directResponse.status).toBe(200);
    const reader = directResponse.body!.getReader();
    let startedRunId: string | undefined;
    let frames = '';
    while (!startedRunId) {
      const chunk = await reader.read();
      if (chunk.done) throw new Error('Agent stream ended before STARTED');
      frames += new TextDecoder().decode(chunk.value);
      for (const match of frames.matchAll(/data:\s*(\{[^\r\n]+\})/g)) {
        const event = JSON.parse(match[1]!) as {
          runtimeRunId?: string;
          status?: string;
        };
        if (event.status === 'STARTED') startedRunId = event.runtimeRunId;
      }
    }
    await expect.poll(() => modelCalls, { timeout: 30_000 }).toBe(4);
    directController.abort();
    await expect
      .poll(
        async () => {
          const run = await (
            await page.request.get(`/api/agent/runs/${startedRunId}`, {
              headers,
            })
          ).json();
          return run.data?.status;
        },
        { timeout: 10_000 },
      )
      .toBe('CANCELLED');

    const cancelRequest = page.waitForRequest((request) =>
      /\/api\/agent\/runs\/[^/]+\/cancel$/.test(request.url()),
    );
    await page.getByRole('button', { name: '停止生成' }).click();
    const cancelledRunId = (await cancelRequest)
      .url()
      .match(/\/runs\/([^/]+)\/cancel$/)?.[1];
    expect(cancelledRunId).toBeTruthy();
    releaseModel();
    await modelResponse;

    await expect
      .poll(async () => {
        const run = await (
          await page.request.get(`/api/agent/runs/${cancelledRunId}`, {
            headers,
          })
        ).json();
        return run.data?.status;
      })
      .toBe('CANCELLED');
    const run = await (
      await page.request.get(`/api/agent/runs/${cancelledRunId}`, {
        headers,
      })
    ).json();
    await expect
      .poll(async () => {
        const execution = await (
          await page.request.get(
            `/api/agent/executions/status?executionId=${run.data.executionId}`,
            { headers },
          )
        ).json();
        return execution.data?.status;
      })
      .toBe('CANCELLED');
    await expect(page.getByRole('log')).not.toContainText('late answer');
    await expect(otherTab.getByRole('log')).toContainText('late answer');
    await expect
      .poll(async () => {
        const listed = await (
          await page.request.get('/api/agent/runs?limit=10', {
            headers,
          })
        ).json();
        return listed.data
          ?.filter((run: { appId: string }) => run.appId === app.data.id)
          .map((run: { status: string }) => run.status)
          .sort();
      })
      .toEqual(['CANCELLED', 'CANCELLED', 'CANCELLED', 'COMPLETED']);
    await otherTab.close();
  } finally {
    releaseModel();
    if (headers) {
      await page.request.put('/api/model/platforms/4', {
        headers,
        data: {
          name: '硅基流动（通义千问）',
          code: 'SILICON_FLOW',
          adapterType: 'OPENAI_COMPATIBLE',
          baseUrl: 'https://api.siliconflow.cn',
          apiKey: '',
          status: '1',
          maxRetries: 3,
        },
      });
    }
    model.closeAllConnections();
    await new Promise<void>((resolve) => model.close(() => resolve()));
  }
});

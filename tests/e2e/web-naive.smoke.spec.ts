import { expect, type Page, test } from 'playwright/test';

const username = process.env.E2E_USERNAME;
const password = process.env.E2E_PASSWORD;

if (!username || !password) {
  throw new Error(
    'E2E_USERNAME and E2E_PASSWORD must be provided; authenticated Playwright acceptance is blocked without CI credentials.',
  );
}

interface MenuNode {
  children?: MenuNode[];
  component?: string;
  path?: string;
}

function collectPagePaths(nodes: MenuNode[]): string[] {
  const paths = new Set<string>();
  const visit = (node: MenuNode) => {
    if (node.component && node.path?.startsWith('/')) paths.add(node.path);
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return [...paths];
}

async function mockConversationStream(
  page: Page,
  onGeneration: (body: Record<string, unknown>) => void,
) {
  await page.route('**/conversations?*', async (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    await route.fulfill({
      body: JSON.stringify({ code: 200, data: [], message: 'success' }),
      contentType: 'application/json',
    });
  });
  await page.route('**/conversations', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await route.fulfill({
      body: JSON.stringify({
        code: 200,
        data: { id: 'conversation-e2e', title: 'E2E conversation' },
        message: 'success',
      }),
      contentType: 'application/json',
    });
  });
  await page.route('**/conversations/*/generations', async (route) => {
    onGeneration(route.request().postDataJSON() as Record<string, unknown>);
    await route.fulfill({
      body: JSON.stringify({
        code: 200,
        data: { id: 'generation-e2e' },
        message: 'success',
      }),
      contentType: 'application/json',
    });
  });
  await page.route('**/generations/generation-e2e/events*', async (route) => {
    await route.fulfill({
      body:
        'id: 0\n' +
        'data: {"success":true,"type":"DELTA","content":"Hello "}\n\n' +
        'id: 1\n' +
        'data: {"success":true,"type":"DELTA","content":"**world**"}\n\n' +
        'id: 2\n' +
        'data: {"success":true,"type":"COMPLETED"}\n\n' +
        'data: [DONE]\n\n',
      contentType: 'text/event-stream',
      status: 200,
    });
  });
  await page.route(
    '**/api/agent/generations/generation-e2e/runtime-events',
    async (route) => {
      await route.fulfill({
        body:
          'data: {"runId":"generation-e2e","seq":0,"type":"RUN_COMPLETED"}\n\n' +
          'data: [DONE]\n\n',
        contentType: 'text/event-stream',
        status: 200,
      });
    },
  );
}

async function signIn(page: Page): Promise<MenuNode[]> {
  await page.goto('/auth/login');
  const inputs = page.locator('input');
  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill(password);
  const menuResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/iam/menus/all') && response.ok(),
  );
  await page.getByRole('button', { name: 'login', exact: true }).click();
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 15_000 });
  const response = (await menuResponsePromise).json();
  return (await response).data ?? [];
}

test.describe('web-naive critical journeys', () => {
  test('loads the six-domain navigation without template residue', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-chromium',
      'The compact layout intentionally hides the desktop sidebar.',
    );
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await signIn(page);

    for (const title of [
      '工作台',
      'AI 工作区',
      '应用开发',
      '知识中心',
      '运行观测',
      '教育空间',
      '个人记录',
      '平台管理',
      '系统管理',
    ]) {
      await expect(
        page.getByText(title, { exact: true }).first(),
      ).toBeVisible();
    }
    await page.getByText('教育空间', { exact: true }).first().click();
    for (const title of ['学习', '练习', 'AI 辅学', '学习分析']) {
      await expect(
        page.getByText(title, { exact: true }).first(),
      ).toBeVisible();
    }
    await expect(page.getByText('收到了 14 份新周报')).toHaveCount(0);
    await expect(page.getByText('Vben Admin', { exact: true })).toHaveCount(0);
    await expect(page.getByText('2/10', { exact: true })).toHaveCount(0);
    await expect(page.getByText('300', { exact: true })).toHaveCount(0);
    expect(runtimeErrors).toEqual([]);
  });

  test('opens representative pages without fallback or horizontal overflow', async ({
    page,
  }) => {
    await signIn(page);
    for (const path of [
      '/workbench/overview',
      '/app-studio/agents',
      '/knowledge-center/documents',
      '/education-center/learning',
      '/education-center/practice',
      '/education-center/analytics',
      '/education-center/ai-tutor',
      '/record/content',
      '/system/user',
    ]) {
      await page.goto(path);
      await expect(page.getByText('404', { exact: true })).toHaveCount(0);
      await expect(
        page.getByText(/菜单加载失败|Navigation failed/),
      ).toHaveCount(0);
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(hasHorizontalOverflow, `${path} overflows horizontally`).toBe(
        false,
      );
    }
  });

  test('opens app and exam workflow routes from their parent pages', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto('/app-studio/apps');
    await expect(
      page.getByText('EducationPractice', { exact: true }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: '创建 App', exact: true }).click();
    await expect(page).toHaveURL(/\/app-studio\/apps\/edit\?new=true/);
    await expect(page.getByText('创建 AI App', { exact: true })).toBeVisible();

    for (const path of [
      '/app-studio/agents/edit?new=true',
      '/education-center/practice/exams',
      '/education-center/practice/exams/take/42',
      '/education-center/practice/exams/result/42',
    ]) {
      await page.goto(path);
      await expect(page.getByText('404', { exact: true })).toHaveCount(0);
      await expect(
        page.getByText(/菜单加载失败|Navigation failed/),
      ).toHaveCount(0);
    }
  });

  test('admin can open quota and audit without a provider permission error', async ({
    page,
  }) => {
    await signIn(page);
    const usageResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/governance/usage/overview') &&
        response.ok(),
    );
    await page.goto('/platform-admin/quotas');
    await expect(
      page.getByRole('heading', { name: '配额与审计', exact: true }),
    ).toBeVisible();
    await usageResponse;
    await expect(
      page.getByText('禁止访问，无权限', { exact: true }),
    ).toHaveCount(0);
  });

  test('opens every authorized menu page without runtime failures', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name === 'mobile-chromium',
      'Every menu page is covered once on desktop; mobile has a focused overflow sweep.',
    );
    test.setTimeout(180_000);
    const runtimeErrors: string[] = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    const menus = await signIn(page);
    const paths = collectPagePaths(menus);

    // The menu service returns only authorized, routable pages. Keep this
    // contract resilient to adding/removing a role-scoped page.
    expect(paths.length).toBeGreaterThan(20);
    for (const path of paths) {
      await page.goto(path);
      await expect(page.getByText('404', { exact: true })).toHaveCount(0);
      await expect(
        page.getByText(/菜单加载失败|Navigation failed/),
      ).toHaveCount(0);
    }

    expect(runtimeErrors).toEqual([]);
  });

  test('streams with the selected platform and one of its models', async ({
    page,
  }) => {
    await signIn(page);
    let requestBody: Record<string, unknown> | undefined;
    await mockConversationStream(page, (body) => {
      requestBody = body;
    });
    await page.goto('/workspace/chat');
    await page.getByLabel(/AI 平台|AI platform/).click();
    await page.getByText('DeepSeek', { exact: true }).last().click();
    await page.getByLabel(/模型|Model/).click();
    await page.getByText('DeepSeek V4 Flash', { exact: true }).last().click();
    await page.getByPlaceholder(/输入你的问题|Ask a question/).fill('hello');
    await page.getByRole('button', { name: /发送|Send/ }).click();
    await expect(page.getByRole('log')).toContainText('Hello world');
    await expect(
      page.getByRole('button', { name: /复制|Copy/ }).first(),
    ).toBeVisible();
    expect(requestBody).toMatchObject({
      model: 'deepseek-v4-flash',
      platform: 'DEEPSEEK',
      content: 'hello',
    });
  });

  test('keeps long select labels readable in the shared workspace controls', async ({
    page,
  }) => {
    await signIn(page);
    await page.goto('/workspace/chat');

    const platformSelect = page.getByLabel(/AI 平台|AI platform/);
    const triggerBox = await platformSelect.boundingBox();
    expect(triggerBox).not.toBeNull();

    await platformSelect.click();
    const menu = page.locator('.n-base-select-menu').last();
    await expect(menu).toBeVisible();
    await expect(
      page.getByText('硅基流动（通义千问）', { exact: true }),
    ).toBeVisible();

    const menuWidth = await menu.evaluate(
      (element) => element.getBoundingClientRect().width,
    );
    expect(menuWidth).toBeGreaterThan((triggerBox?.width ?? 0) + 20);

    await page.keyboard.press('Escape');
    await platformSelect.click();
    await page.getByText('DeepSeek', { exact: true }).last().click();
    await page.getByLabel(/模型|Model/).click();
    await page.getByText('DeepSeek V4 Flash', { exact: true }).last().click();
    const modelLabel = page
      .locator('.n-base-selection-input[title]')
      .filter({ hasText: 'DeepSeek V4 Flash' })
      .first();
    await expect(modelLabel).toHaveAttribute('title', 'DeepSeek V4 Flash');
  });

  test('uses one unified workspace for Chat, Agent and RAG', async ({
    page,
  }) => {
    await signIn(page);
    for (const [path, title] of [
      ['/workspace/chat', 'AI对话'],
      ['/workspace/agent', 'Agent 执行工作区'],
      ['/workspace/rag', 'RAG 检索工作区'],
    ] as const) {
      await page.goto(path);
      await expect(page.getByText('404', { exact: true })).toHaveCount(0);
      await expect(page.getByText(title, { exact: true })).toBeVisible();
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(hasHorizontalOverflow, `${path} overflows horizontally`).toBe(
        false,
      );
    }
  });

  test('shows draft App versions and guides publishing before Agent execution', async ({
    page,
  }) => {
    await signIn(page);
    await page.route('**/api/agent/apps', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        body: JSON.stringify({
          code: 200,
          data: [
            {
              id: 'app-test',
              name: 'Test App',
              status: 'ACTIVE',
              publishedVersionId: null,
            },
          ],
          message: 'success',
        }),
        contentType: 'application/json',
      });
    });
    await page.route('**/api/agent/apps/app-test/versions', async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          code: 200,
          data: [
            {
              id: 'version-draft',
              appId: 'app-test',
              version: '0.1.0',
              status: 'DRAFT',
            },
          ],
          message: 'success',
        }),
        contentType: 'application/json',
      });
    });
    await page.goto('/workspace/agent?appId=app-test');
    await expect(page.getByText('当前 App 还没有可执行版本')).toBeVisible();
    await expect(page.getByText('0.1.0 · 草稿（不可执行）')).toBeVisible();
    await expect(page.getByRole('button', { name: '开始执行' })).toBeDisabled();
  });

  test('creates and publishes an App version with an Agent binding', async ({
    page,
  }) => {
    await signIn(page);
    const calls: string[] = [];
    await page.route('**/api/agent/agents/list', async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          code: 200,
          data: [{ agentId: 'practice', name: 'AI 出题助手', status: 1 }],
          message: 'success',
        }),
        contentType: 'application/json',
      });
    });
    await page.route('**/api/agent/apps', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      calls.push('create-app');
      await route.fulfill({
        body: JSON.stringify({
          code: 200,
          data: { id: 'app-created', name: 'Test App', status: 'ACTIVE' },
          message: 'success',
        }),
        contentType: 'application/json',
      });
    });
    await page.route(
      '**/api/agent/apps/app-created/versions',
      async (route) => {
        calls.push('create-version');
        await route.fulfill({
          body: JSON.stringify({
            code: 200,
            data: {
              id: 'version-created',
              appId: 'app-created',
              version: '0.1.0',
              status: 'DRAFT',
            },
            message: 'success',
          }),
          contentType: 'application/json',
        });
      },
    );
    await page.route(
      '**/api/agent/apps/app-created/versions/version-created/publish',
      async (route) => {
        calls.push('publish-version');
        await route.fulfill({
          body: JSON.stringify({
            code: 200,
            data: {
              id: 'version-created',
              appId: 'app-created',
              version: '0.1.0',
              status: 'PUBLISHED',
            },
            message: 'success',
          }),
          contentType: 'application/json',
        });
      },
    );
    await page.goto('/app-studio/apps/edit?new=true');
    await page.getByPlaceholder('例如：企业知识助手').fill('Test App');
    await page.getByRole('button', { name: '创建并发布' }).click();
    await expect(page).toHaveURL('/app-studio/apps');
    expect(calls).toEqual(['create-app', 'create-version', 'publish-version']);
  });

  test('invokes the selected published App version from Agent workspace', async ({
    page,
  }) => {
    await signIn(page);
    let executionBody: Record<string, unknown> | undefined;
    await page.route('**/api/agent/apps', async (route) => {
      if (route.request().method() !== 'GET') return route.fallback();
      await route.fulfill({
        body: JSON.stringify({
          code: 200,
          data: [
            {
              id: 'app-published',
              name: 'Published App',
              status: 'ACTIVE',
              publishedVersionId: 'version-published',
            },
          ],
          message: 'success',
        }),
        contentType: 'application/json',
      });
    });
    await page.route(
      '**/api/agent/apps/app-published/versions',
      async (route) => {
        await route.fulfill({
          body: JSON.stringify({
            code: 200,
            data: [
              {
                id: 'version-published',
                appId: 'app-published',
                version: '1.0.0',
                status: 'PUBLISHED',
              },
            ],
            message: 'success',
          }),
          contentType: 'application/json',
        });
      },
    );
    await page.route(
      '**/api/agent/apps/app-published/execute',
      async (route) => {
        executionBody = route.request().postDataJSON() as Record<
          string,
          unknown
        >;
        await route.fulfill({
          body: JSON.stringify({
            code: 200,
            data: {
              executionId: 'execution-e2e',
              runtimeRunId: 'run-e2e',
              output: 'Agent response',
            },
            message: 'success',
          }),
          contentType: 'application/json',
        });
      },
    );
    await page.goto('/workspace/agent?appId=app-published');
    await page.getByPlaceholder('输入 Agent 任务').fill('hello agent');
    await page.getByRole('button', { name: '开始执行' }).click();
    await expect(page.getByText('Agent response')).toBeVisible();
    expect(executionBody).toMatchObject({
      prompt: 'hello agent',
      appVersionId: 'version-published',
    });
  });

  test('redirects an expired session without duplicate error messages', async ({
    page,
  }) => {
    await signIn(page);
    await page.route('**/api/governance/usage/**', async (route) => {
      await route.fulfill({
        body: JSON.stringify({
          code: 401,
          data: null,
          message: 'Expired session',
        }),
        contentType: 'application/json',
        status: 401,
      });
    });

    await page.goto('/workbench/overview');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    await expect(page.locator('.n-message--error')).toHaveCount(0);
    await expect(
      page.getByText('Expired session', { exact: true }),
    ).toHaveCount(0);
  });
});

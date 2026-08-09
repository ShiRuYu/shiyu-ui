import { expect, type Page, test } from 'playwright/test';

const username = process.env.E2E_USERNAME ?? 'admin';
const password = process.env.E2E_PASSWORD;

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

async function signIn(page: Page): Promise<MenuNode[]> {
  test.skip(!password, 'Set E2E_PASSWORD to run authenticated smoke tests.');
  await page.goto('/auth/login');
  const inputs = page.locator('input');
  await inputs.nth(0).fill(username);
  await inputs.nth(1).fill(password!);
  const menuResponsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/menu/all') && response.ok(),
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
      'Agent 平台',
      '知识引擎',
      '教育空间',
      '日常记录',
      '系统管理',
    ]) {
      await expect(
        page.getByText(title, { exact: true }).first(),
      ).toBeVisible();
    }
    await page.getByText('教育空间', { exact: true }).first().click();
    for (const title of [
      '学习',
      '练习与考试',
      '复习',
      'AI 辅学',
      '学习分析',
      '教育配置',
    ]) {
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
      '/dashboard/overview',
      '/agent/admin/list',
      '/knowledge/workbench',
      '/learning/course',
      '/practice/question',
      '/review/today',
      '/analytics-center/report',
      '/ai-tutor/teacher',
      '/ai-tutor/practice',
      '/ai-tutor/planner',
      '/ai-tutor/report',
      '/record/records',
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

    expect(paths.length).toBeGreaterThan(40);
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
    let requestBody: Record<string, string> | undefined;
    await page.route('**/chat/send-stream', async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        body:
          'data: {"success":true,"content":"Hello "}\n\n' +
          'data: {"success":true,"content":"**world**"}\n\n',
        contentType: 'text/event-stream',
        status: 200,
      });
    });
    await page.goto('/ai-tutor/chat');
    await page.getByLabel(/AI 平台|AI platform/).click();
    await page.getByText('DeepSeek', { exact: true }).last().click();
    await page.getByLabel(/模型|Model/).click();
    await page.getByText('DeepSeek Chat', { exact: true }).last().click();
    await page.getByPlaceholder(/输入你的问题|Ask a question/).fill('hello');
    await page.getByRole('button', { name: /发送|Send/ }).click();
    await expect(page.getByRole('log')).toContainText('Hello world');
    await expect(page.getByRole('button', { name: /复制|Copy/ })).toBeVisible();
    expect(requestBody).toMatchObject({
      model: 'deepseek-chat',
      platform: 'DEEPSEEK',
      prompt: 'hello',
    });
  });

  test('redirects an expired session without duplicate error messages', async ({
    page,
  }) => {
    await signIn(page);
    await page.route('**/usage/**', async (route) => {
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

    await page.goto('/dashboard/overview');
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15_000 });
    await expect(page.locator('.n-message--error')).toHaveCount(0);
    await expect(
      page.getByText('Expired session', { exact: true }),
    ).toHaveCount(0);
  });
});

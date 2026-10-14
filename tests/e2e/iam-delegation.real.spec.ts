import { expect, test } from 'playwright/test';

test('home administrator can view their detail after delegating to a child tenant', async ({
  page,
}) => {
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
  const homeTenantId = login.data.homeTenantId as number;
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };
  if (login.data.currentTenantId !== homeTenantId) {
    const reset = await (
      await page.request.post('/api/iam/auth/switch-tenant', {
        headers,
        data: { tenantId: homeTenantId },
      })
    ).json();
    expect(reset.code, JSON.stringify(reset)).toBe(200);
  }

  const code = `delegate_e2e_${Date.now()}`;
  const childPassword = 'DelegateTenant123!';
  const created = await (
    await page.request.post('/api/iam/tenants', {
      headers,
      data: {
        code,
        name: '委派回归子租户',
        status: '1',
        adminUsername: `${code}_admin`,
        adminPassword: childPassword,
      },
    })
  ).json();
  expect(created.code).toBe(200);
  const childLogin = await (
    await page.request.post('/api/iam/auth/login', {
      data: { username: `${code}_admin`, password: childPassword },
    })
  ).json();
  expect(childLogin.code).toBe(200);
  const childTenantId = childLogin.data.currentTenantId as number;
  expect(childTenantId).not.toBe(homeTenantId);

  const switched = await (
    await page.request.post('/api/iam/auth/switch-tenant', {
      headers,
      data: { tenantId: childTenantId },
    })
  ).json();
  expect(switched.code, JSON.stringify(switched)).toBe(200);

  const detail = await (
    await page.request.get('/api/iam/users/detail', { headers })
  ).json();
  expect(detail.code, JSON.stringify(detail)).toBe(200);
  expect(detail.data.id).toBe(login.data.id);
  expect(detail.data.currentTenantId).toBe(childTenantId);
  expect(detail.data.currentRole.code).toBe('tenant_super');
  expect(detail.data.switchMode).toBe('PARENT_SUPER_ADMIN');

  const returned = await (
    await page.request.post('/api/iam/auth/switch-tenant', {
      headers,
      data: { tenantId: homeTenantId },
    })
  ).json();
  expect(returned.code).toBe(200);
  const homeDetail = await (
    await page.request.get('/api/iam/users/detail', { headers })
  ).json();
  expect(homeDetail.code).toBe(200);
  expect(homeDetail.data.currentTenantId).toBe(homeTenantId);
  expect(homeDetail.data.switchMode).toBe('NORMAL');
});

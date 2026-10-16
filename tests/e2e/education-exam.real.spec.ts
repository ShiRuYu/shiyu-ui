import { expect, test } from 'playwright/test';

/** Uses the seeded mathematics question and a disposable H2 backend. */
test('publishes, takes, and scores an exam as a regular student', async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);
  const username = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;
  if (!username || !password)
    throw new Error('E2E_USERNAME and E2E_PASSWORD are required');

  await page.goto('/auth/login');
  await page.locator('input').nth(0).fill(username);
  await page.locator('input').nth(1).fill(password);
  const loginResponse = page.waitForResponse('**/api/iam/auth/login');
  await page.getByRole('button', { name: /^(login|sign in|登录)$/i }).click();
  const login = await (await loginResponse).json();
  expect(login.code).toBe(200);
  const headers = { Authorization: `Bearer ${login.data.accessToken}` };

  const localTime = (offsetMinutes: number) =>
    new Date(Date.now() + (offsetMinutes + 8 * 60) * 60_000)
      .toISOString()
      .slice(0, 19);
  const name = `端到端测验-${Date.now()}`;
  const created = await (
    await page.request.post('/api/education/exam', {
      headers,
      data: {
        name,
        type: 'UNIT_TEST',
        subjectCode: 'MATH',
        grade: 7,
        durationMin: 20,
        totalScore: 100,
        startTime: localTime(-1),
        endTime: localTime(30),
      },
    })
  ).json();
  expect(created.code).toBe(200);
  const examId = created.data.id as number;
  const composition = await (
    await page.request.put(`/api/education/exam/${examId}/composition`, {
      headers,
      data: {
        sections: [
          { name: '选择题', questions: [{ questionId: 1, score: 100 }] },
        ],
      },
    })
  ).json();
  expect(composition.code).toBe(200);
  const publication = await (
    await page.request.post(`/api/education/exam/${examId}/publish`, {
      headers,
    })
  ).json();
  expect(publication.code).toBe(200);

  const studentUsername = `exam_student_${Date.now()}`;
  const studentPassword = 'ExamStudent123!';
  const userCreation = await (
    await page.request.post('/api/iam/users', {
      headers,
      data: {
        username: studentUsername,
        password: studentPassword,
        nickName: '考试学生',
        status: '1',
        roleIds: [3],
        tenantId: 1,
      },
    })
  ).json();
  expect(userCreation.code).toBe(200);
  const studentCreation = await (
    await page.request.post('/api/education/students', {
      headers,
      data: {
        name: '考试学生',
        userId: userCreation.data.id,
        grade: 7,
        gradeLevel: 'K2',
        status: 1,
      },
    })
  ).json();
  expect(studentCreation.code).toBe(200);

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.goto('/auth/login');
  await studentPage.locator('input').nth(0).fill(studentUsername);
  await studentPage.locator('input').nth(1).fill(studentPassword);
  const studentLoginResponse = studentPage.waitForResponse(
    '**/api/iam/auth/login',
  );
  await studentPage
    .getByRole('button', { name: /^(login|sign in|登录)$/i })
    .click();
  const studentLogin = await (await studentLoginResponse).json();
  expect(studentLogin.code).toBe(200);
  const studentHeaders = {
    Authorization: `Bearer ${studentLogin.data.accessToken}`,
  };
  const studentTutorKnowledge = await (
    await studentPage.request.get('/api/education/student-tutor/knowledge', {
      headers: studentHeaders,
    })
  ).json();
  expect(studentTutorKnowledge.code).toBe(200);
  expect(Array.isArray(studentTutorKnowledge.data)).toBe(true);
  const emptyTutorReport = await (
    await studentPage.request.post('/api/education/student-tutor/report', {
      headers: studentHeaders,
      data: { period: '7d' },
    })
  ).json();
  expect(emptyTutorReport.code).toBe(200);
  expect(emptyTutorReport.data).toMatchObject({
    insufficientData: true,
    recordCount: 0,
    sources: [],
  });
  const genericAgentExecution = await (
    await studentPage.request.post(
      '/api/agent/executions/execute?agentId=smart-agent',
      {
        headers: studentHeaders,
        data: { prompt: '不应开放通用 Agent 执行' },
      },
    )
  ).json();
  expect(genericAgentExecution.code).not.toBe(200);
  const adminTutorKnowledge = await (
    await page.request.get('/api/education/student-tutor/knowledge', {
      headers,
    })
  ).json();
  expect(adminTutorKnowledge.code).toBe(200);
  const adminOnlyUsername = `tutor_admin_${Date.now()}`;
  const adminOnlyPassword = 'TutorAdmin123!';
  const adminOnly = await (
    await page.request.post('/api/iam/users', {
      headers,
      data: {
        username: adminOnlyUsername,
        password: adminOnlyPassword,
        nickName: '无学生档案管理员',
        status: '1',
        roleIds: [2],
        tenantId: 1,
      },
    })
  ).json();
  expect(adminOnly.code).toBe(200);
  const adminOnlyLogin = await (
    await page.request.post('/api/iam/auth/login', {
      data: { username: adminOnlyUsername, password: adminOnlyPassword },
    })
  ).json();
  expect(adminOnlyLogin.code).toBe(200);
  const adminOnlyKnowledge = await (
    await page.request.get('/api/education/student-tutor/knowledge', {
      headers: { Authorization: `Bearer ${adminOnlyLogin.data.accessToken}` },
    })
  ).json();
  expect(adminOnlyKnowledge.code).not.toBe(200);
  await studentPage.goto('/education-center/ai-tutor/report');
  await expect(
    studentPage.getByRole('button', { name: '生成报告' }),
  ).toBeVisible();
  await studentPage.route(
    '**/api/education/student-tutor/report',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 200,
          data: {
            content: '请按错题继续复习。',
            period: '7d',
            recordCount: 1,
            averageScore: 80,
            insufficientData: false,
            sources: [
              {
                recordId: 77,
                recordType: 'PRACTICE',
                questionId: 2,
                score: 80,
                occurredAt: '2026-10-09T09:00:00',
              },
            ],
          },
        }),
      });
    },
  );
  await studentPage.getByRole('button', { name: '生成报告' }).click();
  await expect(studentPage.getByText('学习记录：1；平均分：80')).toBeVisible();
  const sourceRow = studentPage.locator('li').filter({ hasText: '记录 #77' });
  await expect(sourceRow).toContainText('PRACTICE');
  await expect(sourceRow).toContainText('题目 #2');
  await expect(sourceRow).toContainText('80 分');
  const privateQuestion = await (
    await studentPage.request.get(
      '/api/education/student-learning/questions/1',
      { headers: studentHeaders },
    )
  ).json();
  expect(privateQuestion.code).not.toBe(200);
  const leakedAnswer = await (
    await studentPage.request.post(
      '/api/education/student-learning/questions/1/check',
      { headers: studentHeaders, data: { answer: 'A' } },
    )
  ).json();
  expect(leakedAnswer.code).not.toBe(200);

  const starts = await Promise.all([
    studentPage.request.post(`/api/education/exam/${examId}/attempts`, {
      headers: studentHeaders,
    }),
    studentPage.request.post(`/api/education/exam/${examId}/attempts`, {
      headers: studentHeaders,
    }),
  ]);
  const [firstStart, secondStart] = await Promise.all(
    starts.map((response) => response.json()),
  );
  expect(firstStart.code).toBe(200);
  expect(secondStart.code).toBe(200);
  expect(firstStart.data.attemptId).toBe(secondStart.data.attemptId);

  await studentPage.goto('/education-center/practice/exams');
  await expect(studentPage.getByText(name, { exact: true })).toBeVisible();
  await studentPage
    .locator('.n-card')
    .filter({ hasText: name })
    .getByRole('button', { name: '继续考试' })
    .click();
  await expect(studentPage).toHaveURL(
    new RegExp(`/practice/exams/take/${examId}$`),
  );
  await expect(
    studentPage.getByText('若 2x + 5 = 17，则 x 的值为？'),
  ).toBeVisible();
  await expect(
    studentPage.getByText('移项得 2x = 12，因此 x = 6。'),
  ).toHaveCount(0);
  await studentPage.getByText('B. 6', { exact: true }).click();
  await expect(studentPage.getByText('草稿已保存')).toBeVisible();
  await studentPage.reload();
  await expect(studentPage.getByRole('radio', { name: 'B. 6' })).toBeChecked();
  await studentContext.setOffline(true);
  await studentPage.getByText('A. 5', { exact: true }).click();
  await expect(studentPage.getByText('保存失败')).toBeVisible();
  await studentContext.setOffline(false);
  await expect(studentPage.getByText('草稿已保存')).toBeVisible({
    timeout: 10_000,
  });
  await studentPage.reload();
  await expect(studentPage.getByRole('radio', { name: 'A. 5' })).toBeChecked();
  await studentPage.getByText('B. 6', { exact: true }).click();
  await expect(studentPage.getByText('草稿已保存')).toBeVisible();
  const secondTab = await studentContext.newPage();
  await secondTab.goto(`/education-center/practice/exams/take/${examId}`);
  await expect(secondTab.getByRole('radio', { name: 'B. 6' })).toBeChecked();
  await secondTab.getByRole('button', { name: /交卷|Submit/ }).click();
  await expect(secondTab).toHaveURL(/\/practice\/exams\/result\/\d+$/);
  const secondResultUrl = secondTab.url();
  await studentPage.getByRole('button', { name: /交卷|Submit/ }).click();
  await expect(studentPage).toHaveURL(/\/practice\/exams\/result\/\d+$/);
  expect(studentPage.url()).toBe(secondResultUrl);
  const attemptId = Number(studentPage.url().split('/').pop());
  await expect(studentPage.locator('.n-result-header__description')).toHaveText(
    '得分 100 / 100',
  );
  await expect(
    studentPage.getByText('移项得 2x = 12，因此 x = 6。'),
  ).toBeVisible();

  const otherUsername = `exam_other_${Date.now()}`;
  const otherUser = await (
    await page.request.post('/api/iam/users', {
      headers,
      data: {
        username: otherUsername,
        password: studentPassword,
        nickName: '另一位考试学生',
        status: '1',
        roleIds: [3],
        tenantId: 1,
      },
    })
  ).json();
  expect(otherUser.code).toBe(200);
  const otherProfile = await (
    await page.request.post('/api/education/students', {
      headers,
      data: {
        name: '另一位考试学生',
        userId: otherUser.data.id,
        grade: 7,
        gradeLevel: 'K2',
        status: 1,
      },
    })
  ).json();
  expect(otherProfile.code).toBe(200);
  const otherLogin = await (
    await page.request.post('/api/iam/auth/login', {
      data: { username: otherUsername, password: studentPassword },
    })
  ).json();
  expect(otherLogin.code).toBe(200);
  const otherHeaders = {
    Authorization: `Bearer ${otherLogin.data.accessToken}`,
  };
  const otherResult = await (
    await page.request.get(`/api/education/exam/attempts/${attemptId}`, {
      headers: otherHeaders,
    })
  ).json();
  expect(otherResult.code).not.toBe(200);
  const otherHistory = await (
    await page.request.get('/api/education/exam/history', {
      headers: otherHeaders,
    })
  ).json();
  expect(otherHistory.code).toBe(200);
  expect(otherHistory.data.items).toEqual([]);

  const childTenantCode = `exam_isolation_${Date.now()}`;
  const childAdminPassword = 'ExamTenant123!';
  const childTenant = await (
    await page.request.post('/api/iam/tenants', {
      headers,
      data: {
        code: childTenantCode,
        name: '考试隔离租户',
        status: '1',
        adminUsername: `${childTenantCode}_admin`,
        adminPassword: childAdminPassword,
      },
    })
  ).json();
  expect(childTenant.code).toBe(200);
  const childLogin = await (
    await page.request.post('/api/iam/auth/login', {
      data: {
        username: `${childTenantCode}_admin`,
        password: childAdminPassword,
      },
    })
  ).json();
  expect(childLogin.code).toBe(200);
  expect(childLogin.data.currentTenantId).not.toBe(1);
  const childHeaders = {
    Authorization: `Bearer ${childLogin.data.accessToken}`,
  };
  const childStudent = await (
    await page.request.post('/api/education/students', {
      headers: childHeaders,
      data: {
        name: '其他租户学生',
        userId: childLogin.data.id,
        grade: 7,
        gradeLevel: 'K2',
        status: 1,
      },
    })
  ).json();
  expect(childStudent.code).toBe(200);
  const childQuestion = await (
    await page.request.get('/api/education/student-learning/questions/1', {
      headers: childHeaders,
    })
  ).json();
  expect(childQuestion.code).not.toBe(200);
  const childResult = await (
    await page.request.get(`/api/education/exam/attempts/${attemptId}`, {
      headers: childHeaders,
    })
  ).json();
  expect(childResult.code).not.toBe(200);
  const childHistory = await (
    await page.request.get('/api/education/exam/history', {
      headers: childHeaders,
    })
  ).json();
  expect(childHistory.code).toBe(200);
  expect(childHistory.data.items).toEqual([]);

  await studentPage.goto('/education-center/practice/exams');
  await studentPage
    .locator('.n-tabs-tab')
    .filter({ hasText: '考试记录' })
    .click();
  await expect(
    studentPage.getByText('得分：100', { exact: true }),
  ).toBeVisible();

  const expiryName = `关闭页面到期测验-${Date.now()}`;
  const expiringExam = await (
    await page.request.post('/api/education/exam', {
      headers,
      data: {
        name: expiryName,
        type: 'UNIT_TEST',
        subjectCode: 'MATH',
        grade: 7,
        durationMin: 1,
        totalScore: 100,
        startTime: localTime(-1),
        endTime: localTime(0.75),
      },
    })
  ).json();
  expect(expiringExam.code).toBe(200);
  const expiryExamId = expiringExam.data.id as number;
  const expiryComposition = await (
    await page.request.put(`/api/education/exam/${expiryExamId}/composition`, {
      headers,
      data: {
        sections: [
          { name: '选择题', questions: [{ questionId: 1, score: 100 }] },
        ],
      },
    })
  ).json();
  expect(expiryComposition.code).toBe(200);
  const expiryPublication = await (
    await page.request.post(`/api/education/exam/${expiryExamId}/publish`, {
      headers,
    })
  ).json();
  expect(expiryPublication.code).toBe(200);
  const expiringAttempt = await (
    await studentPage.request.post(
      `/api/education/exam/${expiryExamId}/attempts`,
      { headers: studentHeaders },
    )
  ).json();
  expect(expiringAttempt.code).toBe(200);
  await studentPage.goto(
    `/education-center/practice/exams/take/${expiryExamId}`,
  );
  await studentPage.getByText('B. 6', { exact: true }).click();
  await expect(studentPage.getByText('草稿已保存')).toBeVisible();
  const expiryDeadline = new Date(expiringAttempt.data.deadlineAt).getTime();
  expect(Number.isFinite(expiryDeadline)).toBe(true);
  await studentPage.close();
  await secondTab.close();
  await new Promise((resolve) =>
    setTimeout(resolve, Math.max(0, expiryDeadline - Date.now() + 12_000)),
  );
  const reopenedPage = await studentContext.newPage();
  await reopenedPage.goto('/education-center/practice/exams');
  await reopenedPage
    .locator('.n-tabs-tab')
    .filter({ hasText: '考试记录' })
    .click();
  const expiredCard = reopenedPage
    .locator('.n-card')
    .filter({ hasText: expiryName });
  await expect(expiredCard.getByText('已到期')).toBeVisible();
  await expect(expiredCard.getByText('得分：100')).toBeVisible();
  await expiredCard.getByRole('button', { name: '查看结果' }).click();
  await expect(
    reopenedPage.locator('.n-result-header__description'),
  ).toHaveText('得分 100 / 100');
  await reopenedPage.close();
  await studentContext.close();
});

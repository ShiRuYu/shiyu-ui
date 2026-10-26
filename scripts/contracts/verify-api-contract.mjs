import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const apiRoot = join(root, 'apps/web-naive/src/features');
const snapshotPath = join(root, 'tests/contracts/shiyu-ai-openapi.json');
const httpMethods = new Set([
  'delete',
  'get',
  'head',
  'options',
  'patch',
  'post',
  'put',
]);
const clientMethods = new Set([
  'delete',
  'download',
  'get',
  'patch',
  'post',
  'put',
  'upload',
]);
const update = process.argv.includes('--update');

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, entry]) => [key, stableJson(entry)]),
    );
  }
  return value;
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (extname(entry.name) === '.ts') files.push(path);
  }
  return files;
}

function routeFromExpression(node, sourceFile) {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return undefined;
  let route = node.head.text;
  for (const span of node.templateSpans) route += `{value}${span.literal.text}`;
  return route.replace(/^\{value\}/, '');
}

function fetchMethod(call) {
  const options = call.arguments[1];
  if (!options || !ts.isObjectLiteralExpression(options)) return 'get';
  const methodProperty = options.properties.find(
    (property) =>
      ts.isPropertyAssignment(property) &&
      ((ts.isIdentifier(property.name) && property.name.text === 'method') ||
        (ts.isStringLiteral(property.name) && property.name.text === 'method')),
  );
  if (!methodProperty || !ts.isPropertyAssignment(methodProperty)) return 'get';
  return ts.isStringLiteralLike(methodProperty.initializer)
    ? methodProperty.initializer.text.toLowerCase()
    : 'get';
}

function propertyName(property) {
  if (
    !ts.isPropertyAssignment(property) &&
    !ts.isShorthandPropertyAssignment(property)
  )
    return undefined;
  const name = property.name;
  if (!name) return undefined;
  if (
    ts.isIdentifier(name) ||
    ts.isStringLiteral(name) ||
    ts.isNumericLiteral(name)
  )
    return name.text;
  return undefined;
}

function explicitQueryKeys(call) {
  for (const argument of call.arguments.slice(1)) {
    if (!ts.isObjectLiteralExpression(argument)) continue;
    const params = argument.properties.find(
      (property) =>
        propertyName(property) === 'params' &&
        ts.isPropertyAssignment(property),
    );
    if (
      !params ||
      !ts.isPropertyAssignment(params) ||
      !ts.isObjectLiteralExpression(params.initializer)
    )
      continue;
    return params.initializer.properties
      .map(propertyName)
      .filter((name) => name !== undefined);
  }
  return [];
}

async function collectFrontendCalls() {
  const calls = [];
  const unresolved = [];
  for (const file of await walk(apiRoot)) {
    const source = await readFile(file, 'utf8');
    const sourceFile = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node) {
      if (ts.isCallExpression(node)) {
        let method;
        let routeNode;
        if (
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          ['baseRequestClient', 'requestClient'].includes(
            node.expression.expression.text,
          ) &&
          clientMethods.has(node.expression.name.text)
        ) {
          method = node.expression.name.text;
          method =
            method === 'upload'
              ? 'post'
              : method === 'download'
                ? 'get'
                : method;
          routeNode = node.arguments[0];
        } else if (
          ts.isIdentifier(node.expression) &&
          node.expression.text === 'fetch'
        ) {
          method = fetchMethod(node);
          routeNode = node.arguments[0];
        }
        if (method && routeNode) {
          const route = routeFromExpression(routeNode, sourceFile);
          const location = sourceFile.getLineAndCharacterOfPosition(
            node.getStart(sourceFile),
          );
          const sourceLocation = `${relative(root, file).replaceAll('\\', '/')}:${location.line + 1}`;
          if (route?.startsWith('/'))
            calls.push({
              method,
              route: route.split('?')[0],
              sourceLocation,
              queryKeys: explicitQueryKeys(node),
            });
          else if (route !== undefined)
            unresolved.push({ route, sourceLocation });
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
  }
  return { calls, unresolved };
}

function segments(path) {
  return path.replace(/\/$/, '').split('/').filter(Boolean);
}

function routeMatches(frontendPath, backendPath) {
  return routeMatchScore(frontendPath, backendPath) >= 0;
}

function routeMatchScore(frontendPath, backendPath) {
  const front = segments(frontendPath);
  const back = segments(backendPath);
  if (front.length !== back.length) return -1;
  let score = 0;
  for (const [index, segment] of front.entries()) {
    const serverSegment = back[index];
    const frontVariable = /^\{[^}]+\}$/.test(segment);
    const serverVariable = /^\{[^}]+\}$/.test(serverSegment);
    if (!frontVariable && !serverVariable && segment !== serverSegment)
      return -1;
    if (!frontVariable && !serverVariable) score += 2;
    else score += 1;
  }
  return score;
}

function queryParameters(operation, schemas) {
  const parameters = new Set();
  for (const parameter of operation.parameters ?? []) {
    if (parameter.in !== 'query' || typeof parameter.name !== 'string')
      continue;
    parameters.add(parameter.name);
    const schema = parameter.schema;
    const refPrefix = '#/components/schemas/';
    const schemaName = schema?.$ref?.startsWith(refPrefix)
      ? schema.$ref.slice(refPrefix.length)
      : undefined;
    const resolvedSchema = schemaName ? schemas[schemaName] : schema;
    if (resolvedSchema?.type === 'object') {
      for (const name of Object.keys(resolvedSchema.properties ?? {}))
        parameters.add(name);
    }
  }
  return parameters;
}

function assertCoreSchemas(spec, failures) {
  const schemas = spec.components?.schemas ?? {};
  const resultSchema =
    schemas.ResultObject ??
    Object.values(schemas).find((schema) =>
      ['code', 'data', 'message', 'success'].every(
        (field) => field in (schema.properties ?? {}),
      ),
    );
  if (!resultSchema)
    failures.push('OpenAPI 缺少 code/data/message/success 通用 Result 结构');
  const loginSchema = schemas.LoginResponseVO;
  if (!loginSchema?.properties?.accessToken)
    failures.push('LoginResponseVO 缺少 accessToken');
  const streamOperations = [];
  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) continue;
      const contentTypes = Object.values(operation.responses ?? {}).flatMap(
        (response) => Object.keys(response.content ?? {}),
      );
      if (path.includes('stream'))
        streamOperations.push({ contentTypes, method, path });
    }
  }
  for (const operation of streamOperations) {
    if (
      !operation.contentTypes.some((type) => type.includes('text/event-stream'))
    ) {
      failures.push(
        `${operation.method.toUpperCase()} ${operation.path} 未声明 text/event-stream`,
      );
    }
  }
}

function resolveSchema(schema, schemas) {
  const ref = schema?.$ref;
  if (ref?.startsWith('#/components/schemas/')) {
    return schemas[ref.slice('#/components/schemas/'.length)];
  }
  return schema;
}

function responseSchema(operation, schemas) {
  const response = operation?.responses?.['200'];
  const content = response?.content ?? {};
  const media = content['application/json'] ?? content['*/*'];
  return resolveSchema(media?.schema, schemas);
}

function requestSchema(operation, schemas) {
  return resolveSchema(
    operation?.requestBody?.content?.['application/json']?.schema,
    schemas,
  );
}

function fieldSchema(schema, field, schemas) {
  const property = resolveSchema(schema, schemas)?.properties?.[field];
  return resolveSchema(
    property?.type === 'array' ? property.items : property,
    schemas,
  );
}

function requireFields(schema, fields, label, failures) {
  if (!schema || schema.type !== 'object') {
    failures.push(`${label} 缺少对象响应/请求 schema`);
    return;
  }
  for (const field of fields) {
    if (!(field in (schema.properties ?? {})))
      failures.push(`${label} 缺少 ${field}`);
  }
}

function requirePropertyType(schema, field, type, format, label, failures) {
  const property = schema?.properties?.[field];
  if (property?.type !== type || (format && property?.format !== format)) {
    failures.push(
      `${label}.${field} 类型应为 ${type}${format ? `/${format}` : ''}`,
    );
  }
}

function requireRequired(schema, fields, label, failures) {
  for (const field of fields) {
    if (!schema?.required?.includes(field))
      failures.push(`${label}.${field} 应为必填`);
  }
}

function assertJourneySchemas(spec, failures) {
  const schemas = spec.components?.schemas ?? {};
  const operation = (path, method) => {
    const result = spec.paths?.[path]?.[method];
    if (!result) failures.push(`${method.toUpperCase()} ${path} 缺失`);
    return result;
  };
  const data = (path, method) =>
    fieldSchema(
      responseSchema(operation(path, method), schemas),
      'data',
      schemas,
    );

  const paper = data('/api/education/exam/{examId}/paper', 'get');
  requireFields(
    paper,
    ['examId', 'attemptId', 'sections', 'deadlineAt'],
    '学生试卷',
    failures,
  );
  const section = fieldSchema(paper, 'sections', schemas);
  requireFields(
    section,
    ['id', 'name', 'orderNo', 'questions'],
    '试卷大题',
    failures,
  );
  const question = fieldSchema(section, 'questions', schemas);
  requireFields(
    question,
    ['id', 'questionId', 'title', 'type', 'score', 'options'],
    '试卷题目',
    failures,
  );
  requirePropertyType(
    question,
    'questionId',
    'integer',
    'int64',
    '试卷题目',
    failures,
  );
  for (const secret of ['answer', 'correctAnswer', 'analysis']) {
    if (secret in (question?.properties ?? {}))
      failures.push(`试卷题目不应暴露 ${secret}`);
  }
  requireFields(
    fieldSchema(question, 'options', schemas),
    ['value', 'label'],
    '试卷选项',
    failures,
  );

  const submitPath = '/api/education/exam/attempts/{attemptId}/submit';
  const submit = operation(submitPath, 'post');
  const request = requestSchema(submit, schemas);
  requireFields(request, ['answers'], '交卷请求', failures);
  requireRequired(request, ['answers'], '交卷请求', failures);
  const submittedAnswer = fieldSchema(request, 'answers', schemas);
  requireFields(
    submittedAnswer,
    ['questionId', 'answer'],
    '交卷答案',
    failures,
  );
  requireRequired(submittedAnswer, ['questionId'], '交卷答案', failures);
  requirePropertyType(
    submittedAnswer,
    'questionId',
    'integer',
    'int64',
    '交卷答案',
    failures,
  );
  const result = fieldSchema(responseSchema(submit, schemas), 'data', schemas);
  requireFields(
    result,
    ['attemptId', 'status', 'score', 'totalScore', 'questions'],
    '交卷结果',
    failures,
  );
  requireFields(
    fieldSchema(result, 'questions', schemas),
    ['questionId', 'answer', 'correctAnswer', 'score', 'maxScore'],
    '题目结果',
    failures,
  );
  requireFields(
    data('/api/education/exam/attempts/{attemptId}', 'get'),
    ['attemptId', 'status', 'score', 'questions'],
    '持久化结果',
    failures,
  );

  const practiceCheck = requestSchema(
    operation('/api/education/student-learning/questions/{id}/check', 'post'),
    schemas,
  );
  requireRequired(practiceCheck, ['answer'], '练习校验请求', failures);
  requirePropertyType(
    practiceCheck,
    'answer',
    'string',
    null,
    '练习校验请求',
    failures,
  );
  const practiceSubmit = operation(
    '/api/education/student-learning/questions/{id}/submissions',
    'post',
  );
  const practiceRequest = requestSchema(practiceSubmit, schemas);
  requireRequired(
    practiceRequest,
    ['answer', 'submissionKey'],
    '练习提交请求',
    failures,
  );
  requirePropertyType(
    practiceRequest,
    'answer',
    'string',
    null,
    '练习提交请求',
    failures,
  );
  requirePropertyType(
    practiceRequest,
    'submissionKey',
    'string',
    null,
    '练习提交请求',
    failures,
  );
  if ('studentId' in (practiceRequest?.properties ?? {})) {
    failures.push('练习提交请求不能接受 studentId');
  }
  const practiceResult = fieldSchema(
    responseSchema(practiceSubmit, schemas),
    'data',
    schemas,
  );
  requireFields(
    practiceResult,
    ['recordId', 'questionId', 'correct', 'correctAnswer', 'analysis'],
    '练习提交结果',
    failures,
  );
  requirePropertyType(
    practiceResult,
    'recordId',
    'integer',
    'int64',
    '练习提交结果',
    failures,
  );
  requirePropertyType(
    practiceResult,
    'correct',
    'boolean',
    null,
    '练习提交结果',
    failures,
  );
  const wrongPractice = data(
    '/api/education/student-learning/wrong-questions',
    'get',
  );
  requireFields(
    wrongPractice,
    ['id', 'questionId', 'title', 'correctTimes'],
    '本人错题',
    failures,
  );
  const questionCreate = requestSchema(
    operation('/api/education/question', 'post'),
    schemas,
  );
  const purpose = questionCreate?.properties?.purpose;
  if (
    purpose?.type !== 'string' ||
    !['PRACTICE', 'EXAM_PRIVATE'].every((value) =>
      purpose.enum?.includes(value),
    )
  ) {
    failures.push('题目用途应声明 PRACTICE/EXAM_PRIVATE 枚举');
  }

  const tutorRequest = requestSchema(
    operation('/api/education/student-tutor/teach', 'post'),
    schemas,
  );
  if ('studentId' in (tutorRequest?.properties ?? {})) {
    failures.push('学生辅学请求不能接受 studentId');
  }
  requirePropertyType(
    tutorRequest,
    'knowledgeId',
    'integer',
    'int64',
    '辅学请求',
    failures,
  );
  const tutorReport = data('/api/education/student-tutor/report', 'post');
  requirePropertyType(
    tutorReport,
    'recordCount',
    'integer',
    'int32',
    '辅学报告',
    failures,
  );
  requirePropertyType(
    tutorReport,
    'insufficientData',
    'boolean',
    null,
    '辅学报告',
    failures,
  );

  const agentExecute = operation(
    '/api/conversation/conversations/{conversationId}/agent-executions',
    'post',
  );
  const agentRequest = requestSchema(agentExecute, schemas);
  requireRequired(
    agentRequest,
    ['appId', 'prompt'],
    'Agent 会话执行',
    failures,
  );
  requirePropertyType(
    agentRequest,
    'appId',
    'string',
    null,
    'Agent 会话执行',
    failures,
  );
  requirePropertyType(
    agentRequest,
    'sourceMessageId',
    'string',
    null,
    'Agent 会话执行',
    failures,
  );
  if (
    'userId' in (agentRequest?.properties ?? {}) ||
    'tenantId' in (agentRequest?.properties ?? {})
  ) {
    failures.push('Agent 会话执行不能接受用户或租户标识');
  }

  const stream = operation('/api/conversation/generations/{id}/events', 'get');
  const streamSchema = resolveSchema(
    stream?.responses?.['200']?.content?.['text/event-stream']?.schema,
    schemas,
  );
  requireFields(
    streamSchema,
    ['generationRunId', 'sequence', 'type', 'payload', 'createdAt'],
    '生成 SSE data 事件',
    failures,
  );
}

async function loadSpec() {
  if (update) {
    const url =
      process.env.CONTRACT_OPENAPI_URL ?? 'http://127.0.0.1:9000/v3/api-docs';
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`无法读取 ${url}: HTTP ${response.status}`);
    const live = await response.json();
    // The process port is an environment detail, not part of the API contract.
    live.servers = [
      { description: 'Generated server url', url: 'http://127.0.0.1:9000' },
    ];
    const text = `${JSON.stringify(stableJson(live), null, 2)}\n`;
    await writeFile(snapshotPath, text, 'utf8');
    console.log(`OpenAPI snapshot updated from ${url}`);
  }
  return JSON.parse(await readFile(snapshotPath, 'utf8'));
}

const spec = await loadSpec();
const schemas = spec.components?.schemas ?? {};
const { calls, unresolved } = await collectFrontendCalls();
const failures = [];
const backendOperations = [];
for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of Object.keys(pathItem)) {
    if (httpMethods.has(method))
      backendOperations.push({ method, path, operation: pathItem[method] });
  }
}
for (const call of calls) {
  const matchingOperations = backendOperations
    .filter(
      (operation) =>
        operation.method === call.method &&
        routeMatches(call.route, operation.path),
    )
    .sort(
      (left, right) =>
        routeMatchScore(call.route, right.path) -
        routeMatchScore(call.route, left.path),
    );
  if (matchingOperations.length === 0)
    failures.push(
      `${call.method.toUpperCase()} ${call.route} (${call.sourceLocation})`,
    );
  else {
    const operation = matchingOperations[0];
    const parameters = queryParameters(operation.operation, schemas);
    for (const key of call.queryKeys) {
      if (!parameters.has(key))
        failures.push(
          `${call.method.toUpperCase()} ${call.route} uses unknown query parameter ${key} (${call.sourceLocation})`,
        );
    }
  }
}
assertCoreSchemas(spec, failures);
assertJourneySchemas(spec, failures);

const uniqueCalls = new Set(
  calls.map((call) => `${call.method} ${call.route}`),
);
console.log(
  `contract summary: frontend calls=${calls.length}, unique=${uniqueCalls.size}, ` +
    `backend operations=${backendOperations.length}, unresolved expressions=${unresolved.length}`,
);
if (unresolved.length > 0) {
  console.log('unresolved dynamic expressions (manual review):');
  for (const item of unresolved)
    console.log(`  ${item.sourceLocation} ${item.route}`);
}
if (failures.length > 0) {
  console.error(`contract failures (${failures.length}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exitCode = 1;
} else {
  console.log('API contract verification passed.');
}

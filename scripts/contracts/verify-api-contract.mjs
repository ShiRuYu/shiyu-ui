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

async function loadSpec() {
  if (update) {
    const url =
      process.env.CONTRACT_OPENAPI_URL ?? 'http://127.0.0.1:9000/v3/api-docs';
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`无法读取 ${url}: HTTP ${response.status}`);
    const text = `${JSON.stringify(await response.json(), null, 2)}\n`;
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

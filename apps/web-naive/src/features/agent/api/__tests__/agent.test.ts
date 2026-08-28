import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  getBaseUrl: vi.fn<() => string | undefined>(() => 'https://api.example.test'),
  post: vi.fn(),
}));

const consumeStreamMock = vi.hoisted(() => vi.fn());

vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));
vi.mock('#/shared/api/stream', () => ({
  consumeEventStream: consumeStreamMock,
}));
vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ accessToken: 'agent-token' }),
}));

import * as adminApi from '../admin';
import * as graphApi from '../graph';
import * as intentApi from '../intent-def';
import * as nodeTypeApi from '../node-type';
import * as runtimeApi from '../runtime';
import * as tutorApi from '../tutor-agent';
import * as versionApi from '../version';

import {
  deleteAgent,
  executeAgent,
  executeAgentStream,
  getAgent,
  getAgentList,
  registerAgent,
  switchAgentVersion,
} from '../agent';

describe('agent feature transport facade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue({ data: [] });
    requestMock.post.mockResolvedValue({ data: { ok: true } });
    consumeStreamMock.mockImplementation(async (_response, onEvent) => {
      onEvent({ data: '{"content":"hello"}' });
      onEvent({ data: 'plain chunk' });
      onEvent({ data: '[DONE]' });
    });
  });

  it('maps Agent definition commands to the domain API', async () => {
    const definition = {
      agentId: 'agent-1',
      name: 'Tutor',
      description: 'test',
    };

    await registerAgent({ agentId: 'agent-1', name: 'Tutor' });
    await getAgentList();
    await getAgent('agent-1');
    await deleteAgent('agent-1');
    await switchAgentVersion('agent-1', 'v2');
    await executeAgent('agent-1', { input: 'hello' });

    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/agent/agents/register',
      { agentId: 'agent-1', name: 'Tutor' },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      1,
      '/api/agent/agents/list',
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(
      2,
      '/api/agent/agents/detail/by-agent-id',
      { params: { agentId: 'agent-1' } },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      2,
      '/api/agent/agents/delete/by-agent-id',
      null,
      { params: { agentId: 'agent-1' } },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      3,
      '/api/agent/agents/version/switch',
      null,
      { params: { agentId: 'agent-1', version: 'v2' } },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      4,
      '/api/agent/executions/execute',
      { input: 'hello' },
      { params: { agentId: 'agent-1' } },
    );
    expect(definition.name).toBe('Tutor');
  });

  it('streams execution output with the authenticated transport adapter', async () => {
    requestMock.getBaseUrl.mockReturnValueOnce(undefined);
    consumeStreamMock.mockImplementationOnce(async (_response, onEvent) => {
      onEvent({ data: '{"data":{"output":42}}' });
      onEvent({ data: '{' });
      onEvent({ data: '[DONE]' });
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(''));
    const chunks: string[] = [];

    await executeAgentStream('agent-1', { input: 'hello' }, (chunk) =>
      chunks.push(chunk),
    );

    expect(fetch).toHaveBeenCalledWith(
      '/api/agent/executions/execute-stream?agentId=agent-1',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer agent-token',
          Accept: 'text/event-stream',
        }),
      }),
    );
    expect(chunks).toEqual(['{\n  "output": 42\n}\n', '{']);
  });

  it('covers agent administration, graph, version and runtime facades explicitly', async () => {
    const payload = {} as any;
    await adminApi.getAgentPage({ page: 1, pageSize: 10, name: 'Tutor' });
    await adminApi.getAgentById(1);
    await adminApi.getAgentListAll();
    await adminApi.createAgent(payload);
    await adminApi.updateAgent(1, payload);
    await adminApi.deleteAgent(1);
    await adminApi.toggleAgentStatus(1, 1);

    await graphApi.getGraphConfig('agent-1', 2);
    await graphApi.updateGraphConfig('agent-1', 2, payload);
    await graphApi.validateGraphConfig('agent-1', 2, payload);
    await graphApi.addNode('agent-1', 2, payload);
    await graphApi.updateNode('agent-1', 2, 'node-1', payload);
    await graphApi.deleteNode('agent-1', 2, 'node-1');
    await graphApi.addEdge('agent-1', 2, payload);
    await graphApi.deleteEdge('agent-1', 2, 'node-1', 'node-2');
    await graphApi.getCanvasConfig('agent-1', 2);
    await graphApi.updateCanvasConfig('agent-1', 2, '{}');

    await intentApi.getIntentDefPage();
    await intentApi.createIntentDef(payload);
    await intentApi.updateIntentDef(1, payload);
    await intentApi.deleteIntentDef(1);
    await intentApi.batchDeleteIntentDef([1, 2]);
    await nodeTypeApi.getNodeTypes();
    await nodeTypeApi.getNodeType('TOOL');

    await versionApi.getVersionList('agent-1');
    await versionApi.getVersionDetail('agent-1', 2);
    await versionApi.createVersion('agent-1', payload);
    await versionApi.updateVersion('agent-1', 2, payload);
    await versionApi.deleteVersion('agent-1', 2);
    await versionApi.publishVersion('agent-1', 2);
    await versionApi.archiveVersion('agent-1', 2);
    await versionApi.activateVersion('agent-1', 2);
    await versionApi.copyVersion('agent-1', 2, payload);

    await runtimeApi.listRuntimeApps();
    await runtimeApi.createRuntimeApp({ name: 'Tutor' });
    await runtimeApi.listRuntimeRuns();
    await runtimeApi.listRuntimeRuns(10);
    await runtimeApi.listModelProviders();
    await runtimeApi.listRuntimeAppVersions('app-1');
    await runtimeApi.createRuntimeAppVersion('app-1', { version: 'v1' });
    await runtimeApi.publishRuntimeAppVersion('app-1', 'v1');
    await runtimeApi.archiveRuntimeAppVersion('app-1', 'v1');
    await runtimeApi.getRuntimeRunEvents('run-1');
    await runtimeApi.getRuntimeRunEvents('run-1', 4);
    await runtimeApi.cancelRuntimeRun('run-1');
    await runtimeApi.listRunApprovals('run-1');
    await runtimeApi.listRuntimeApprovals();
    await runtimeApi.decideApproval('approval-1', 'approve');

    const event = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('chunk')),
    );
    consumeStreamMock.mockImplementation(async (_response, onEvent) => {
      onEvent({ data: '{"runId":"run-1","seq":1,"type":"TOKEN"}' });
      onEvent({ data: '{' });
      onEvent({ data: '[DONE]' });
    });
    await runtimeApi.streamGenerationRuntimeEvents('generation-1', event);
    await tutorApi.teach(payload);
    await tutorApi.practice(payload);
    await tutorApi.generateExam(payload);
    await tutorApi.getTodayReviewTasks();
    await tutorApi.completeReviewTask(payload);
    await tutorApi.generatePlan(payload);
    await tutorApi.generateReport(payload);
    const chunks: string[] = [];
    await tutorApi.teachStream(payload, (chunk) => chunks.push(chunk));

    expect(requestMock.get).toHaveBeenCalled();
    expect(requestMock.post).toHaveBeenCalled();
    expect(event).toHaveBeenCalledWith({
      runId: 'run-1',
      seq: 1,
      type: 'TOKEN',
    });
    expect(chunks.join('')).toContain('chunk');
  });
});

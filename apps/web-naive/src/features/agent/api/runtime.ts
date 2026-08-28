import { useAccessStore } from '@vben/stores';

import { requestClient } from '#/shared/api/request';
import { consumeEventStream } from '#/shared/api/stream';

export type RuntimeMode = 'agent' | 'chat' | 'rag';

export interface AiAppSummary {
  id: string;
  name: string;
  description?: string;
  status?: string;
  publishedVersionId?: null | string;
}

export interface AiAppVersionSummary {
  id: string;
  appId: string;
  version: string;
  status: string;
  configJson?: string;
  publishedAt?: null | string;
}

export interface AiRunEvent {
  runId: string;
  seq: number;
  type: string;
  payload?: string;
  createdAt?: string;
}

export interface AiRunSummary {
  id: string;
  sourceType?: string;
  model?: string;
  status: string;
  promptTokens?: number;
  completionTokens?: number;
  createdAt?: string;
  completedAt?: string;
  errorCode?: string;
}

export interface ModelProviderCapability {
  provider: string;
  model: string;
  features?: string[];
  contextWindow?: number;
  healthy?: boolean;
}

export interface ToolApproval {
  id: string;
  runId: string;
  toolName: string;
  status: string;
  reason?: string;
}
export type RuntimeApproval = ToolApproval;

export async function listRuntimeApps() {
  return requestClient.get<AiAppSummary[]>('/api/agent/apps');
}

export async function createRuntimeApp(data: {
  description?: string;
  name: string;
}) {
  return requestClient.post<AiAppSummary>('/api/agent/apps', data);
}

export async function listRuntimeRuns(limit = 50) {
  return requestClient.get<AiRunSummary[]>('/api/agent/runs', {
    params: { limit },
  });
}

export async function listModelProviders() {
  return requestClient.get<ModelProviderCapability[]>('/api/model/providers');
}

export async function listRuntimeAppVersions(appId: string) {
  return requestClient.get<AiAppVersionSummary[]>(
    `/api/agent/apps/${appId}/versions`,
  );
}

export async function createRuntimeAppVersion(
  appId: string,
  data: { configJson?: string; version: string },
) {
  return requestClient.post<AiAppVersionSummary>(
    `/api/agent/apps/${appId}/versions`,
    data,
  );
}

export async function publishRuntimeAppVersion(
  appId: string,
  versionId: string,
) {
  return requestClient.post<AiAppVersionSummary>(
    `/api/agent/apps/${appId}/versions/${versionId}/publish`,
  );
}

export async function archiveRuntimeAppVersion(
  appId: string,
  versionId: string,
) {
  return requestClient.post<AiAppVersionSummary>(
    `/api/agent/apps/${appId}/versions/${versionId}/archive`,
  );
}

export async function getRuntimeRunEvents(runId: string, afterSeq = 0) {
  return requestClient.get<AiRunEvent[]>(
    `/api/agent/runs/${runId}/event-history`,
    {
      params: { afterSeq },
    },
  );
}

export async function cancelRuntimeRun(runId: string) {
  return requestClient.post<unknown>(`/api/agent/runs/${runId}/cancel`);
}

export async function streamGenerationRuntimeEvents(
  generationId: string,
  onEvent: (event: AiRunEvent) => void,
  signal?: AbortSignal,
) {
  const token = useAccessStore().accessToken;
  const baseURL = requestClient.getBaseUrl() ?? '';
  const response = await fetch(
    `${baseURL}/api/agent/generations/${encodeURIComponent(generationId)}/runtime-events?follow=true&waitMs=30000`,
    {
      headers: {
        Accept: 'text/event-stream',
        Authorization: token ? `Bearer ${token}` : '',
      },
      signal,
    },
  );
  await consumeEventStream(
    response,
    ({ data }) => {
      if (!data || data === '[DONE]') return;
      try {
        onEvent(JSON.parse(data) as AiRunEvent);
      } catch {
        // Ignore malformed intermediary frames; the durable generation stream remains authoritative.
      }
    },
    signal,
  );
}

export async function listRunApprovals(runId: string) {
  return requestClient.get<ToolApproval[]>(
    `/api/agent/runs/${runId}/approvals`,
  );
}

export async function listRuntimeApprovals() {
  return requestClient.get<RuntimeApproval[]>('/api/agent/approvals');
}

export async function decideApproval(
  id: string,
  decision: 'approve' | 'reject',
) {
  return requestClient.post<ToolApproval>(
    `/api/agent/approvals/${id}/${decision}`,
  );
}

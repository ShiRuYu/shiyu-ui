import { requestClient } from '#/shared/api/request';

export interface PromptSummary {
  id: string;
  name: string;
  template: string;
  variables: string[];
  status: string;
  createdAt?: string;
}

export interface PromptPreview {
  content: string;
  estimatedTokens: number;
  variables: string[];
}

export function listPrompts() {
  return requestClient.get<PromptSummary[]>('/api/conversation/prompts');
}

export function createPrompt(data: {
  name: string;
  template: string;
  variables: string[];
}) {
  return requestClient.post<PromptSummary>('/api/conversation/prompts', data);
}

export function previewPrompt(data: {
  template: string;
  variables: Record<string, unknown>;
}) {
  return requestClient.post<PromptPreview>(
    '/api/conversation/prompts/preview',
    data,
  );
}

export function publishPrompt(id: string) {
  return requestClient.post<PromptSummary>(
    `/api/conversation/prompts/${id}/publish`,
  );
}

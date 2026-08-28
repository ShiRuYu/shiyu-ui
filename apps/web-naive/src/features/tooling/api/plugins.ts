import { requestClient } from '#/shared/api/request';

export interface PluginSummary {
  id: string;
  name: string;
  version?: string;
  status?: string;
  signed?: boolean;
}

export function listPlugins() {
  return requestClient.get<PluginSummary[]>('/api/tooling/plugins');
}

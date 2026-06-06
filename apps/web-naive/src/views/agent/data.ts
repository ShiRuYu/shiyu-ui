import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { AgentApi } from '#/api/agent/agent';

import { $t } from '#/locales';

export function useColumns(): VxeTableGridColumns<AgentApi.AgentDefinition> {
  return [
    { field: 'agentId', title: 'Agent ID', width: 200 },
    { field: 'name', title: $t('agent.name'), width: 150 },
    { field: 'description', title: $t('agent.description') },
    { field: 'currentVersion', title: $t('agent.version'), width: 120 },
    { field: 'createdAt', title: $t('agent.createdAt'), width: 180 },
  ];
}

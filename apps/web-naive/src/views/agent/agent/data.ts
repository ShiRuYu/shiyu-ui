import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { AgentApi } from '#/api/agent/agent';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: $t('common.keyword'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'agentId',
      label: 'Agent ID',
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', ['Agent ID'])),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('agent.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('agent.name')])),
    },
    {
      component: 'Input',
      componentProps: { type: 'textarea', rows: 3 },
      fieldName: 'description',
      label: $t('agent.description'),
    },
    {
      component: 'Input',
      fieldName: 'versionNumber',
      label: $t('agent.version'),
      defaultValue: 'v1.0.0',
    },
    {
      component: 'Input',
      componentProps: { type: 'textarea', rows: 3 },
      fieldName: 'versionDescription',
      label: $t('agent.versionDescription'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<AgentApi.AgentDefinition>,
): VxeTableGridColumns<AgentApi.AgentDefinition> {
  return [
    { field: 'agentId', title: 'Agent ID', width: 200 },
    { field: 'name', title: $t('agent.name'), width: 150 },
    { field: 'description', title: $t('agent.description') },
    { field: 'currentVersion', title: $t('agent.version'), width: 120 },
    { field: 'createdAt', title: $t('agent.createdAt'), width: 180 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('agent.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'chat', label: $t('agent.chat'), icon: 'ant-design:message-outlined' },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.role.operation'),
      width: 200,
    },
  ];
}

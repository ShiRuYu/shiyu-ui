import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { AgentAdminApi } from '#/api/agent/admin';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: $t('agent.adminFormPlaceholderName') },
      fieldName: 'name',
      label: $t('agent.adminListSearch'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: $t('agent.adminListStatusNormal'), value: '1' },
          { label: $t('agent.adminListStatusDisabled'), value: '0' },
        ],
        placeholder: $t('agent.adminFormPlaceholderStatus'),
      },
      fieldName: 'status',
      label: $t('agent.adminFormLabelStatus'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'agentId',
      label: $t('agent.adminFormLabelAgentId'),
      rules: z
        .string()
        .min(1, $t('agent.adminFormValidationAgentIdRequired'))
        .regex(
          /^[a-z][a-z0-9-]*$/,
          $t('agent.adminFormValidationAgentIdPattern'),
        ),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('agent.adminFormLabelName'),
      rules: z.string().min(1, $t('agent.adminFormValidationNameRequired')),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 500, rows: 2, type: 'textarea' },
      fieldName: 'description',
      label: $t('agent.adminFormLabelDescription'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('agent.adminFormLabelEnabled'), value: '1' },
          { label: $t('agent.adminFormLabelDisabled'), value: '0' },
        ],
        optionType: 'button',
      },
      defaultValue: '1',
      fieldName: 'status',
      label: $t('agent.adminFormLabelStatus'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<AgentAdminApi.AgentVO>,
): VxeTableGridColumns<AgentAdminApi.AgentVO> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'agentId', title: $t('agent.adminFormLabelAgentId'), width: 160 },
    { field: 'name', title: $t('agent.adminEditName'), width: 160 },
    { field: 'description', title: $t('agent.description'), minWidth: 200 },
    { field: 'currentVersion', title: $t('agent.version'), width: 120 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('agent.adminListStatusNormal'), value: '1' },
          { color: 'error', label: $t('agent.adminListStatusDisabled'), value: '0' },
        ],
      },
      field: 'status',
      title: $t('agent.adminEditStatus'),
      width: 100,
    },
    { field: 'createTime', title: $t('agent.createdAt'), width: 160 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('agent.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete', { code: 'version', label: $t('agent.version') }],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 200,
    },
  ];
}

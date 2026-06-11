import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { AgentAdminApi } from '#/api/agent/admin';

import { z } from '#/adapter/form';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: 'Agent 名称' },
      fieldName: 'name',
      label: '名称',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: '正常', value: '1' },
          { label: '停用', value: '0' },
        ],
        placeholder: '状态',
      },
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'agentId',
      label: 'Agent标识',
      rules: z
        .string()
        .min(1, 'Agent标识不能为空')
        .regex(
          /^[a-z][a-z0-9-]*$/,
          '只能包含小写字母、数字和连字符，以字母开头',
        ),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: 'Agent名称',
      rules: z.string().min(1, 'Agent名称不能为空'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 500, rows: 2, type: 'textarea' },
      fieldName: 'description',
      label: '描述',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '启用', value: '1' },
          { label: '停用', value: '0' },
        ],
        optionType: 'button',
      },
      defaultValue: '1',
      fieldName: 'status',
      label: '状态',
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<AgentAdminApi.AgentVO>,
): VxeTableGridColumns<AgentAdminApi.AgentVO> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'agentId', title: 'Agent标识', width: 160 },
    { field: 'name', title: '名称', width: 160 },
    { field: 'description', title: '描述', minWidth: 200 },
    { field: 'currentVersion', title: '当前版本', width: 120 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '正常', value: '1' },
          { color: 'error', label: '停用', value: '0' },
        ],
      },
      field: 'status',
      title: '状态',
      width: 100,
    },
    { field: 'createTime', title: '创建时间', width: 160 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: 'Agent',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete', { code: 'version', label: '版本' }],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 200,
    },
  ];
}

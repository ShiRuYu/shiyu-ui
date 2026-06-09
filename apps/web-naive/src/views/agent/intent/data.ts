import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { IntentDefApi } from '#/api/agent/intent-def';
import { z } from '#/adapter/form';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '意图名称' },
      fieldName: 'name',
      label: '名称',
    },
    {
      component: 'Input',
      componentProps: { placeholder: '意图代码' },
      fieldName: 'code',
      label: '代码',
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        options: [
          { label: 'CONVERSATION', value: 'CONVERSATION' },
          { label: 'KNOWLEDGE', value: 'KNOWLEDGE' },
          { label: 'TASK', value: 'TASK' },
          { label: 'SEARCH', value: 'SEARCH' },
          { label: 'TECHNICAL', value: 'TECHNICAL' },
        ],
        placeholder: '分类',
      },
      fieldName: 'category',
      label: '分类',
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: '意图代码',
      rules: z.string().min(1, '意图代码不能为空').regex(/^[A-Z][A-Z0-9_]*$/, '只能包含大写字母、数字和下划线'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '意图名称',
      rules: z.string().min(1, '意图名称不能为空'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 500, rows: 2, type: 'textarea' },
      fieldName: 'description',
      label: '描述',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'default', value: 'default' },
        ],
      },
      defaultValue: 'default',
      fieldName: 'agentId',
      label: '所属 Agent',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'CONVERSATION', value: 'CONVERSATION' },
          { label: 'KNOWLEDGE', value: 'KNOWLEDGE' },
          { label: 'TASK', value: 'TASK' },
          { label: 'SEARCH', value: 'SEARCH' },
          { label: 'TECHNICAL', value: 'TECHNICAL' },
        ],
      },
      defaultValue: 'CONVERSATION',
      fieldName: 'category',
      label: '分类',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, max: 100 },
      defaultValue: 50,
      fieldName: 'priority',
      label: '优先级',
    },
    {
      component: 'Input',
      fieldName: 'targetNode',
      label: '目标节点',
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'enabled',
      label: '启用',
    },
  ];
}

export function useColumns(onActionClick?: any): VxeTableGridColumns<IntentDefApi.IntentDefVO> {
  return [
    { field: 'id', title: 'ID', width: 70 },
    { field: 'code', title: '代码', width: 140 },
    { field: 'name', title: '名称', width: 140 },
    { field: 'category', title: '分类', width: 120 },
    { field: 'priority', title: '优先级', width: 80 },
    { field: 'confidenceThreshold', title: '置信度阈值', width: 120 },
    { field: 'targetNode', title: '目标节点', width: 130 },
    { field: 'description', title: '描述', minWidth: 200, ellipsis: { tooltip: true } },
    {
      cellRender: { name: 'CellTag', options: [{ color: 'success', label: '启用', value: true }, { color: 'error', label: '停用', value: false }] },
      field: 'enabled',
      title: '启用',
      width: 80,
    },
    { field: 'createTime', title: '创建时间', width: 160 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', nameTitle: '意图', onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 160,
    },
  ];
}

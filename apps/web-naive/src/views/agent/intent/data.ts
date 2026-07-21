import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { IntentDefApi } from '#/api/agent/intent-def';
import { z } from '#/adapter/form';

import { getDictByType } from '#/api/system/dict';
import { getAgentListAll } from '#/api/agent/admin';

// 分类代码 → 名称映射，用于表格列显示
let categoryLabelMap: Record<string, string> = {};

export async function initCategoryLabelMap() {
  const data = await getDictByType('INTENT_CATEGORY');
  categoryLabelMap = (data || []).reduce(
    (map: Record<string, string>, item: any) => {
      map[item.dictValue] = item.dictLabel;
      return map;
    },
    {},
  );
}

async function getIntentCodeOptions() {
  const data = await getDictByType('INTENT_CODE');
  return (data || []).map((item: any) => ({
    label: item.dictLabel,
    value: item.dictValue,
  }));
}

async function getIntentCategoryOptions() {
  const data = await getDictByType('INTENT_CATEGORY');
  return (data || []).map((item: any) => ({
    label: item.dictLabel,
    value: item.dictValue,
  }));
}

async function getAgentOptions() {
  const data = await getAgentListAll();
  return (data || []).map((item: any) => ({
    label: item.name,
    value: item.code,
  }));
}

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
      component: 'ApiSelect',
      componentProps: {
        api: getAgentOptions,
        clearable: true,
        placeholder: '所属Agent',
      },
      fieldName: 'agentId',
      label: '所属 Agent',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        clearable: true,
        api: getIntentCategoryOptions,
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
      component: 'ApiSelect',
      componentProps: {
        api: getIntentCodeOptions,
        placeholder: '选择意图编码',
      },
      defaultValue: 'CHITCHAT',
      fieldName: 'code',
      label: '意图代码',
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
      component: 'ApiSelect',
      componentProps: {
        api: getAgentOptions,
        placeholder: '选择所属Agent',
      },
      fieldName: 'agentId',
      label: '所属 Agent',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getIntentCategoryOptions,
        placeholder: '选择分类',
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

export function useColumns(
  onActionClick?: any,
): VxeTableGridColumns<IntentDefApi.IntentDefVO> {
  return [
    { field: 'id', title: 'ID', width: 70 },
    { field: 'code', title: '代码', width: 140 },
    { field: 'name', title: '名称', width: 140 },
    { field: 'agentId', title: 'Agent', width: 120 },
    {
      field: 'category',
      title: '分类',
      width: 120,
      formatter: ({ cellValue }: any) =>
        categoryLabelMap[cellValue] || cellValue,
    },
    { field: 'priority', title: '优先级', width: 80 },
    { field: 'confidenceThreshold', title: '置信度阈值', width: 120 },
    { field: 'targetNode', title: '目标节点', width: 130 },
    {
      field: 'description',
      title: '描述',
      minWidth: 200,
      ellipsis: { tooltip: true },
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'error', label: '停用', value: false },
        ],
      },
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

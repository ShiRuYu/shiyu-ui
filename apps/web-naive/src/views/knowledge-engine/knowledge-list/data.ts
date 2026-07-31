import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export interface KnowledgePoint {
  [key: string]: any;
  id: number;
  code: string;
  name: string;
  description: string;
  difficulty?: number;
  category?: string;
  tags?: string;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'keyword', label: $t('knowledge.name') },
    { component: 'Input', fieldName: 'category', label: $t('knowledge.code') },
  ];
}

export function useSchema(
  difficultyOptions: Array<{ label: string; value: number }> = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
    { label: '4', value: 4 },
    { label: '5', value: 5 },
  ],
): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('knowledge.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('knowledge.name')])),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('knowledge.code'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('knowledge.code')])),
    },
    {
      component: 'Input',
      componentProps: { type: 'textarea', rows: 3 },
      fieldName: 'description',
      label: $t('knowledge.description'),
    },
    {
      component: 'Select',
      componentProps: {
        options: difficultyOptions,
      },
      fieldName: 'difficultyLevel',
      label: $t('knowledge.difficulty'),
    },
    {
      component: 'Input',
      fieldName: 'category',
      label: $t('knowledge.category'),
    },
    {
      component: 'Input',
      fieldName: 'tags',
      label: $t('knowledge.tags'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<KnowledgePoint>,
): VxeTableGridColumns<KnowledgePoint> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: $t('knowledge.code'), width: 120 },
    { field: 'name', title: $t('knowledge.name'), width: 200 },
    {
      field: 'description',
      title: $t('knowledge.description'),
      width: 250,
    },
    {
      field: 'difficultyLevel',
      title: $t('knowledge.difficulty'),
      width: 90,
    },
    {
      field: 'category',
      title: $t('knowledge.category'),
      width: 120,
    },
    {
      field: 'tags',
      title: $t('knowledge.tags'),
      width: 160,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('knowledge.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 150,
    },
  ];
}

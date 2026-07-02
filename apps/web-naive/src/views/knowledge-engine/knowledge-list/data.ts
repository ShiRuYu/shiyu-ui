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
  estimatedTime: number;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('knowledge.name') },
    { component: 'Input', fieldName: 'code', label: $t('knowledge.code') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input', fieldName: 'name', label: $t('knowledge.name'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('knowledge.name')])),
    },
    {
      component: 'Input', fieldName: 'code', label: $t('knowledge.code'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('knowledge.code')])),
    },
    {
      component: 'Input', componentProps: { type: 'textarea', rows: 3 }, fieldName: 'description', label: $t('knowledge.description'),
    },
    {
      component: 'InputNumber', fieldName: 'estimatedTime', label: $t('knowledge.estimatedTime'),
    },
  ];
}

export function useColumns(onActionClick?: OnActionClickFn<KnowledgePoint>): VxeTableGridColumns<KnowledgePoint> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: $t('knowledge.code'), width: 120 },
    { field: 'name', title: $t('knowledge.name'), width: 200 },
    {
      field: 'description', title: $t('knowledge.description'), width: 250,
    },
    { field: 'estimatedTime', title: $t('knowledge.estimatedTime'), width: 120 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', nameTitle: $t('knowledge.name'), onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation', fixed: 'right', headerAlign: 'center',
      showOverflow: false, title: $t('common.operation'), width: 150,
    },
  ];
}

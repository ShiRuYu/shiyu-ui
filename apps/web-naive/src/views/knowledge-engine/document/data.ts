import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export interface Document {
  [key: string]: any;
  id: number;
  title: string;
  knowledgeId: number;
  content: string;
  fileType: string;
  fileSize: number;
}

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('knowledge.documentTitle'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('knowledge.documentTitle'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('knowledge.documentTitle')])),
    },
    {
      component: 'InputNumber',
      fieldName: 'knowledgeId',
      label: $t('knowledge.name'),
      rules: z
        .number()
        .min(1, $t('ui.formRules.required', [$t('knowledge.name')])),
    },
    {
      component: 'Input',
      componentProps: { type: 'textarea', rows: 5 },
      fieldName: 'content',
      label: $t('record.records.content'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<Document>,
): VxeTableGridColumns<Document> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'title', title: $t('knowledge.documentTitle'), width: 200 },
    { field: 'knowledgeId', title: $t('knowledge.name'), width: 120 },
    { field: 'fileType', title: $t('knowledge.fileType'), width: 100 },
    { field: 'fileSize', title: $t('knowledge.fileSize'), width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: $t('knowledge.documentTitle'),
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

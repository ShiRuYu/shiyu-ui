import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';
import { getKnowledgeListApi } from '#/api/knowledge';
import { $t } from '#/locales';

async function getKnowledgeOptions() {
  const result = await getKnowledgeListApi({ pageSize: 1000 });
  return (result?.items || result || []).map((k: any) => ({ id: k.id, name: `[${k.code}] ${k.name}` }));
}

export interface Document {
  [key: string]: any;
  id: number;
  title: string;
  content: string;
  docType: string;
  source: string;
  knowledgeIds: number[];
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
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getKnowledgeOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        multiple: true,
      },
      fieldName: 'knowledgeIds',
      label: $t('knowledge.name'),
      rules: z
        .array(z.number())
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
    { field: 'docType', title: $t('knowledge.fileType'), width: 100 },
    { field: 'source', title: '来源', width: 150 },
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

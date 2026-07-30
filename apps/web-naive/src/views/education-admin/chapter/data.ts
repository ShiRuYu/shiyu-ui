import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationChapterApi } from '#/api/education/chapter';

import { z } from '#/adapter/form';
import { getChapterOptions } from '#/api/education/chapter';
import { getTextbookOptions } from '#/api/education/textbook';
import { getKnowledgeListApi } from '#/api/knowledge';
import { $t } from '#/locales';
async function getKnowledgeOptions() {
  const result = await getKnowledgeListApi({ pageSize: 1000 });
  const items = result?.items || result || [];
  return items.map((k: { code: string; id: number; name: string }) => {
    return { id: k.id, name: `[${k.code}] ${k.name}` };
  });
}
export function useGridFormSchema() {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.chapter.name'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getTextbookOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
      },
      fieldName: 'textbookId',
      label: $t('education.chapter.textbookId'),
    },
  ];
}
export function useSchema() {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.chapter.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('education.chapter.name')])),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getTextbookOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
      },
      fieldName: 'textbookId',
      label: $t('education.chapter.textbookId'),
      rules: z
        .number()
        .min(
          1,
          $t('ui.formRules.required', [$t('education.chapter.textbookId')]),
        ),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getChapterOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        placeholder: $t('education.chapter.selectParent'),
      },
      fieldName: 'parentId',
      label: $t('education.chapter.parentId'),
    },
    {
      component: 'InputNumber',
      fieldName: 'chapterOrder',
      label: $t('education.chapter.chapterOrder'),
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
        placeholder: 'Select knowledge points',
      },
      fieldName: 'knowledgeIds',
      label: 'Knowledge Points',
    },
  ];
}
export function useColumns(
  onActionClick: OnActionClickFn<EducationChapterApi.Chapter>,
) {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.chapter.name'), width: 200 },
    {
      field: 'textbookId',
      title: $t('education.chapter.textbookId'),
      width: 120,
    },
    { field: 'parentId', title: $t('education.chapter.parentId'), width: 120 },
    {
      field: 'chapterOrder',
      title: $t('education.chapter.chapterOrder'),
      width: 100,
    },
    { field: 'knowledgeCount', title: 'Knowledge', width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('education.chapter.name'),
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

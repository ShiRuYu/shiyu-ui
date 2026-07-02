import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationChapterApi } from '#/api/education/chapter';
import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('education.chapter.name') },
    { component: 'InputNumber', fieldName: 'textbookId', label: $t('education.chapter.textbookId') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input', fieldName: 'name', label: $t('education.chapter.name'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.chapter.name')])),
    },
    {
      component: 'InputNumber', fieldName: 'textbookId', label: $t('education.chapter.textbookId'),
      rules: z.number().min(1, $t('ui.formRules.required', [$t('education.chapter.textbookId')])),
    },
    {
      component: 'InputNumber', fieldName: 'parentId', label: $t('education.chapter.parentId'),
    },
    {
      component: 'InputNumber', fieldName: 'chapterOrder', label: $t('education.chapter.chapterOrder'),
    },
  ];
}

export function useColumns(onActionClick?: OnActionClickFn<EducationChapterApi.Chapter>): VxeTableGridColumns<EducationChapterApi.Chapter> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.chapter.name'), width: 200 },
    { field: 'textbookId', title: $t('education.chapter.textbookId'), width: 120 },
    { field: 'parentId', title: $t('education.chapter.parentId'), width: 120 },
    { field: 'chapterOrder', title: $t('education.chapter.chapterOrder'), width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', nameTitle: $t('education.chapter.name'), onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation', fixed: 'right', headerAlign: 'center',
      showOverflow: false, title: $t('common.operation'), width: 150,
    },
  ];
}

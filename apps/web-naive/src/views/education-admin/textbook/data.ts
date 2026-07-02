import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationTextbookApi } from '#/api/education/textbook';
import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('education.textbook.name') },
    { component: 'Input', fieldName: 'publisher', label: $t('education.textbook.publisher') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input', fieldName: 'name', label: $t('education.textbook.name'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.textbook.name')])),
    },
    {
      component: 'Input', fieldName: 'subjectCode', label: $t('education.textbook.subjectCode'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.textbook.subjectCode')])),
    },
    { component: 'InputNumber', fieldName: 'grade', label: $t('course.grade') },
    { component: 'Input', fieldName: 'publisher', label: $t('education.textbook.publisher') },
    { component: 'Input', fieldName: 'isbn', label: $t('education.textbook.isbn') },
  ];
}

export function useColumns(onActionClick?: OnActionClickFn<EducationTextbookApi.Textbook>): VxeTableGridColumns<EducationTextbookApi.Textbook> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.textbook.name'), width: 180 },
    { field: 'subjectCode', title: $t('education.textbook.subjectCode'), width: 120 },
    { field: 'grade', title: $t('course.grade'), width: 80 },
    { field: 'publisher', title: $t('education.textbook.publisher'), width: 150 },
    { field: 'isbn', title: $t('education.textbook.isbn'), width: 150 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', nameTitle: $t('education.textbook.name'), onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation', fixed: 'right', headerAlign: 'center',
      showOverflow: false, title: $t('common.operation'), width: 150,
    },
  ];
}

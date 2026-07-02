import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationSubjectApi } from '#/api/education/subject';
import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('education.subject.name') },
    { component: 'Input', fieldName: 'code', label: $t('education.subject.code') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input', fieldName: 'code', label: $t('education.subject.code'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.subject.code')])),
    },
    {
      component: 'Input', fieldName: 'name', label: $t('education.subject.name'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.subject.name')])),
    },
    {
      component: 'Input', fieldName: 'gradeLevel', label: $t('education.subject.gradeLevel'),
    },
    {
      component: 'Input', fieldName: 'icon', label: $t('education.subject.icon'),
    },
    {
      component: 'InputNumber', fieldName: 'sortOrder', label: $t('education.subject.sortOrder'),
    },
  ];
}

export function useColumns(onActionClick?: OnActionClickFn<EducationSubjectApi.Subject>): VxeTableGridColumns<EducationSubjectApi.Subject> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: $t('education.subject.code'), width: 120 },
    { field: 'name', title: $t('education.subject.name'), width: 150 },
    { field: 'gradeLevel', title: $t('education.subject.gradeLevel'), width: 100 },
    { field: 'icon', title: $t('education.subject.icon'), width: 100 },
    { field: 'sortOrder', title: $t('education.subject.sortOrder'), width: 80 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', nameTitle: $t('education.subject.name'), onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation', fixed: 'right', headerAlign: 'center',
      showOverflow: false, title: $t('common.operation'), width: 150,
    },
  ];
}

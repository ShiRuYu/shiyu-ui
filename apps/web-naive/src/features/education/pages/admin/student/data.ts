import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationStudentApi } from '#/features/education/api';

import { z } from '#/adapter/form';
import { getUserOptions } from '#/features/iam';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.student.name'),
    },
    {
      component: 'Input',
      fieldName: 'studentNo',
      label: $t('education.student.studentNo'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getUserOptions,
        class: 'w-full',
        labelField: 'nickName',
        valueField: 'id',
      },
      fieldName: 'userId',
      label: $t('education.student.userId'),
      rules: z
        .number()
        .min(1, $t('ui.formRules.required', [$t('education.student.userId')])),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.student.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('education.student.name')])),
    },
    {
      component: 'Input',
      fieldName: 'studentNo',
      label: $t('education.student.studentNo'),
    },
    {
      component: 'Input',
      fieldName: 'school',
      label: $t('education.student.school'),
    },
    {
      component: 'Input',
      fieldName: 'className',
      label: $t('education.student.className'),
    },
    {
      component: 'InputNumber',
      fieldName: 'grade',
      label: $t('education.student.grade'),
      rules: z
        .number()
        .min(1, $t('ui.formRules.required', [$t('education.student.grade')])),
    },
    {
      component: 'Input',
      fieldName: 'gradeLevel',
      label: $t('education.student.gradeLevel'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationStudentApi.Student>,
): VxeTableGridColumns<EducationStudentApi.Student> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'userId', title: '用户ID', width: 80 },
    {
      field: 'studentNo',
      title: $t('education.student.studentNo'),
      width: 120,
    },
    { field: 'name', title: $t('education.student.name'), width: 150 },
    { field: 'school', title: $t('education.student.school'), width: 200 },
    {
      field: 'className',
      title: $t('education.student.className'),
      width: 120,
    },
    { field: 'grade', title: $t('education.student.grade'), width: 80 },
    {
      field: 'gradeLevel',
      title: $t('education.student.gradeLevel'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('education.student.name'),
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

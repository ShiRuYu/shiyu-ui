import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationResourceApi } from '#/api/education/resource';

import { z } from '#/adapter/form';
import { getSubjectOptions } from '#/api/education/subject';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.resource.name'),
    },
    {
      component: 'Input',
      fieldName: 'type',
      label: $t('education.resource.type'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.resource.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('education.resource.name')])),
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: $t('education.resource.type'),
      componentProps: {
        options: [
          { label: $t('education.resource.typeVideo'), value: 'VIDEO' },
          { label: $t('education.resource.typeDocument'), value: 'DOCUMENT' },
          { label: $t('education.resource.typeExercise'), value: 'EXERCISE' },
          {
            label: $t('education.resource.typeInteractive'),
            value: 'INTERACTIVE',
          },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: $t('education.resource.url'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSubjectOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'code',
      },
      fieldName: 'subjectCode',
      label: $t('education.course.subjectCode'),
    },
    { component: 'InputNumber', fieldName: 'grade', label: $t('education.course.grade') },
    {
      component: 'InputNumber',
      fieldName: 'difficulty',
      label: $t('education.resource.difficulty'),
    },
    {
      component: 'Input',
      fieldName: 'coverUrl',
      label: $t('education.resource.coverUrl'),
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: $t('education.resource.description'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationResourceApi.Resource>,
): VxeTableGridColumns<EducationResourceApi.Resource> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.resource.name'), width: 180 },
    { field: 'type', title: $t('education.resource.type'), width: 100 },
    { field: 'subjectCode', title: $t('education.course.subjectCode'), width: 100 },
    { field: 'grade', title: $t('education.course.grade'), width: 80 },
    {
      field: 'viewCount',
      title: $t('education.resource.viewCount'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('education.resource.name'),
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

import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ResourceApi } from '#/api';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.resource.name'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: $t('education.resource.video'), value: 'VIDEO' },
          { label: $t('education.resource.document'), value: 'DOCUMENT' },
          { label: $t('education.resource.audio'), value: 'AUDIO' },
          { label: $t('education.resource.image'), value: 'IMAGE' },
          { label: $t('education.resource.other'), value: 'OTHER' },
        ],
      },
      fieldName: 'type',
      label: $t('education.resource.type'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'url',
      label: $t('education.resource.url'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'subjectCode',
      label: $t('education.resource.subjectCode'),
    },
    {
      component: 'InputNumber',
      fieldName: 'grade',
      label: $t('education.resource.grade'),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 1, max: 5, style: { width: '100%' } },
      fieldName: 'difficulty',
      label: $t('education.resource.difficulty'),
    },
    {
      component: 'Input',
      fieldName: 'coverUrl',
      label: $t('education.resource.coverUrl'),
    },
    {
      component: 'Textarea',
      fieldName: 'description',
      label: $t('education.resource.description'),
    },
  ];
}

export function useColumns<T = ResourceApi.Resource>(): VxeTableGridColumns {
  return [
    {
      field: 'name',
      title: $t('education.resource.name'),
      minWidth: 180,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'type',
      title: $t('education.resource.type'),
      width: 100,
    },
    {
      field: 'url',
      title: $t('education.resource.url'),
      minWidth: 200,
    },
    {
      field: 'subjectCode',
      title: $t('education.resource.subjectCode'),
      width: 100,
    },
    {
      field: 'grade',
      title: $t('education.resource.grade'),
      width: 80,
    },
    {
      field: 'viewCount',
      title: $t('education.resource.viewCount'),
      width: 100,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: $t('common.operation'),
      width: 180,
    },
  ];
}

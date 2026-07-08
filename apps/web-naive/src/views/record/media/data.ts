import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { MediaApi } from '#/api/record/media';

import { $t } from '#/locales';
import { getRecordOptions } from '#/api/record/records';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'type', label: $t('record.media.type') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRecordOptions,
        class: 'w-full',
        labelField: 'content',
        valueField: 'id',
      },
      fieldName: 'recordId',
      label: $t('record.media.recordId'),
    },
    { component: 'Input', fieldName: 'url', label: $t('record.media.url') },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: $t('record.media.typeImage'), value: 'image' },
          { label: $t('record.media.typeVideo'), value: 'video' },
          { label: $t('record.media.typeAudio'), value: 'audio' },
          { label: $t('record.media.typeFile'), value: 'file' },
        ],
      },
      fieldName: 'type',
      label: $t('record.media.type'),
    },
    {
      component: 'InputNumber',
      fieldName: 'size',
      label: $t('record.media.size'),
    },
    {
      component: 'InputNumber',
      fieldName: 'duration',
      label: $t('record.media.duration'),
    },
    {
      component: 'InputNumber',
      fieldName: 'width',
      label: $t('record.media.width'),
    },
    {
      component: 'InputNumber',
      fieldName: 'height',
      label: $t('record.media.height'),
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: $t('record.media.sort'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<MediaApi.Media>,
): VxeTableGridColumns<MediaApi.Media> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'recordId', title: $t('record.media.recordId'), width: 100 },
    { field: 'url', title: $t('record.media.url'), width: 200 },
    { field: 'type', title: $t('record.media.type'), width: 100 },
    { field: 'size', title: $t('record.media.size'), width: 100 },
    { field: 'duration', title: $t('record.media.duration'), width: 80 },
    { field: 'sort', title: $t('record.media.sort'), width: 80 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'url',
          nameTitle: $t('record.media.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.role.operation'),
      width: 150,
    },
  ];
}

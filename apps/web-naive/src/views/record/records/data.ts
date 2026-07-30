import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { RecordsApi } from '#/api/record/records';

import { getTimelineOptions } from '#/api/record/timeline';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      fieldName: 'eventId',
      label: $t('record.records.eventId'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getTimelineOptions,
        class: 'w-full',
        labelField: 'title',
        valueField: 'id',
      },
      fieldName: 'eventId',
      label: $t('record.records.eventId'),
    },
    {
      component: 'Input',
      componentProps: { type: 'textarea', rows: 3 },
      fieldName: 'content',
      label: $t('record.records.content'),
    },
    { component: 'Input', fieldName: 'mood', label: $t('record.records.mood') },
    {
      component: 'Input',
      fieldName: 'location',
      label: $t('record.records.location'),
    },
    {
      component: 'Input',
      fieldName: 'weather',
      label: $t('record.records.weather'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<RecordsApi.Record>,
): VxeTableGridColumns<RecordsApi.Record> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'eventId', title: $t('record.records.eventId'), width: 100 },
    {
      field: 'content',
      title: $t('record.records.content'),
      width: 300,
      showOverflow: 'tooltip',
    },
    { field: 'mood', title: $t('record.records.mood'), width: 80 },
    { field: 'location', title: $t('record.records.location'), width: 120 },
    { field: 'weather', title: $t('record.records.weather'), width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: $t('record.records.name'),
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

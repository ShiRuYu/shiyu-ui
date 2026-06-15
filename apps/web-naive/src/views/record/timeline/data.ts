import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { TimelineApi } from '#/api/record/timeline';

import { z } from '#/adapter/form';
import { getProfileOptions } from '#/api/record/profile';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        autoSelect: 'first',
        api: getProfileOptions,
        labelField: 'name',
        valueField: 'id',
        allowClear: true,
        placeholder: $t('ui.placeholder.select'),
      },
      fieldName: 'profileId',
      label: $t('record.timeline.profileName'),
      rules: z
        .number()
        .min(
          1,
          $t('ui.formRules.required', [$t('record.timeline.profileName')]),
        ),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        autoSelect: 'first',
        api: getProfileOptions,
        labelField: 'name',
        valueField: 'id',
        placeholder: $t('ui.placeholder.select'),
      },
      fieldName: 'profileId',
      label: $t('record.timeline.profileName'),
      rules: z
        .number()
        .min(
          1,
          $t('ui.formRules.required', [$t('record.timeline.profileName')]),
        ),
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('record.timeline.eventTitle'),
      rules: z
        .string()
        .min(
          1,
          $t('ui.formRules.required', [$t('record.timeline.eventTitle')]),
        ),
    },
    {
      component: 'DatePicker',
      componentProps: {
        clearable: true,
        type: 'datetime',
        valueFormat: 'yyyy-MM-dd HH:mm:ss',
      },
      fieldName: 'eventTime',
      label: $t('record.timeline.eventTime'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('record.timeline.eventTime')])),
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '里程碑', value: 'milestone' },
          { label: '日常', value: 'daily' },
          { label: '自定义', value: 'custom' },
        ],
      },
      defaultValue: 'custom',
      fieldName: 'type',
      label: $t('record.timeline.type'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('record.timeline.type')])),
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: '私密', value: 'private' },
          { label: '家庭', value: 'family' },
          { label: '公开', value: 'public' },
        ],
      },
      defaultValue: 'family',
      fieldName: 'visibility',
      label: $t('record.timeline.visibility'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<TimelineApi.TimelineEvent>,
): VxeTableGridColumns<TimelineApi.TimelineEvent> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'title', title: $t('record.timeline.eventTitle'), width: 200 },
    { field: 'eventTime', title: $t('record.timeline.eventTime'), width: 180 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'primary', label: '里程碑', value: 'milestone' },
          { color: 'info', label: '日常', value: 'daily' },
          { color: 'warning', label: '自定义', value: 'custom' },
        ],
      },
      field: 'type',
      title: $t('record.timeline.type'),
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'error', label: '私密', value: 'private' },
          { color: 'success', label: '家庭', value: 'family' },
          { color: 'info', label: '公开', value: 'public' },
        ],
      },
      field: 'visibility',
      title: $t('record.timeline.visibility'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'title',
          nameTitle: $t('record.timeline.eventTitle'),
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

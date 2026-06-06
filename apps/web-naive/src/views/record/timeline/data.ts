import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { TimelineApi } from '#/api/record/timeline';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'InputNumber',
      componentProps: { min: 1 },
      fieldName: 'profileId',
      label: $t('record.timeline.profileId'),
      rules: z
        .number()
        .min(1, $t('ui.formRules.required', [$t('record.timeline.profileId')])),
    },
  ];
}

export function useColumns(): VxeTableGridColumns<TimelineApi.TimelineEvent> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'title', title: $t('record.timeline.title'), width: 200 },
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
  ];
}

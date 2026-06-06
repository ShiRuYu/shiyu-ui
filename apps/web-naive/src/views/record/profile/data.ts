import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { ProfileApi } from '#/api/record/profile';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('record.profile.name'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('record.profile.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('record.profile.name')])),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
          { label: '未知', value: 'unknown' },
        ],
        optionType: 'button',
      },
      defaultValue: 'unknown',
      fieldName: 'gender',
      label: $t('system.user.sex'),
    },
    {
      component: 'DatePicker',
      componentProps: { type: 'date' },
      fieldName: 'birthDate',
      label: $t('record.profile.birthDate'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.normal'), value: '1' },
          { label: $t('common.disabled'), value: '0' },
        ],
        optionType: 'button',
      },
      defaultValue: '1',
      fieldName: 'status',
      label: $t('common.status'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<ProfileApi.Profile>,
): VxeTableGridColumns<ProfileApi.Profile> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('record.profile.name'), width: 150 },
    { field: 'gender', title: $t('system.user.sex'), width: 80 },
    { field: 'birthDate', title: $t('record.profile.birthDate'), width: 150 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.normal'), value: '1' },
          { color: 'error', label: $t('common.disabled'), value: '0' },
        ],
      },
      field: 'status',
      title: $t('common.status'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('record.profile.name'),
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

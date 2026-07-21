import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { AuthCodeApi } from '#/api/system/auth-code';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.authCode.code'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.authCode.code'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.authCode.code')])),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.authCode.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.authCode.name')])),
    },
    {
      component: 'InputNumber',
      fieldName: 'roleId',
      label: $t('system.authCode.roleId'),
      rules: z
        .number()
        .min(1, $t('ui.formRules.required', [$t('system.authCode.roleId')])),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<AuthCodeApi.AuthCodeItem>,
): VxeTableGridColumns<AuthCodeApi.AuthCodeItem> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: $t('system.authCode.code'), width: 200 },
    { field: 'name', title: $t('system.authCode.name'), width: 200 },
    { field: 'roleId', title: $t('system.authCode.roleId'), width: 100 },
    { field: 'status', title: $t('common.status'), width: 80 },
    {
      field: 'createTime',
      title: $t('system.authCode.createTime'),
      width: 180,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'code',
          nameTitle: $t('system.authCode.code'),
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

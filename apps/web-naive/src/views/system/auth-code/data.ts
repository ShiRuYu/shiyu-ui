import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import { useAccessStore } from '@vben/stores';

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
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.authCode.name'),
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
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<AuthCodeApi.AuthCodeItem>,
): VxeTableGridColumns<AuthCodeApi.AuthCodeItem> {
  const accessStore = useAccessStore();
  const can = (code: string) => accessStore.accessCodes.includes(code);
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: $t('system.authCode.code'), width: 200 },
    { field: 'name', title: $t('system.authCode.name'), width: 200 },
    { field: 'module', title: $t('system.authCode.module'), width: 110 },
    { field: 'resource', title: $t('system.authCode.resource'), width: 130 },
    { field: 'action', title: $t('system.authCode.action'), width: 110 },
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
        options: [
          { code: 'edit', show: () => can('system:auth-code:update') },
          { code: 'delete', show: () => can('system:auth-code:delete') },
        ],
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

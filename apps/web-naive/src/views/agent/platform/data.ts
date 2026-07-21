import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { PlatformApi } from '#/api/agent/platform';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.platform.name'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.platform.code'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.platform.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.platform.name')])),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.platform.code'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.platform.code')])),
    },
    {
      component: 'Input',
      fieldName: 'baseUrl',
      label: $t('system.platform.baseUrl'),
    },
    {
      component: 'Input',
      fieldName: 'apiKey',
      label: $t('system.platform.apiKey'),
    },
    {
      component: 'InputNumber',
      componentProps: { max: 2, min: 0, step: 0.1 },
      defaultValue: 0.7,
      fieldName: 'temperature',
      label: $t('system.platform.temperature'),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 1 },
      defaultValue: 4096,
      fieldName: 'maxTokens',
      label: $t('system.platform.maxTokens'),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0 },
      defaultValue: 3,
      fieldName: 'maxRetries',
      label: $t('system.platform.maxRetries'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.normal'), value: 1 },
          { label: $t('common.disabled'), value: 0 },
        ],
        optionType: 'button',
      },
      defaultValue: 1,
      fieldName: 'status',
      label: $t('common.status'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.yes'), value: 'Y' },
          { label: $t('common.no'), value: 'N' },
        ],
        optionType: 'button',
      },
      defaultValue: 'N',
      fieldName: 'isDefault',
      label: $t('system.platform.isDefault'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 500, rows: 3, type: 'textarea' },
      fieldName: 'availableModels',
      label: $t('system.platform.availableModels'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 2000, rows: 4, type: 'textarea' },
      fieldName: 'extraConfig',
      label: $t('system.platform.extraConfig'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 200, rows: 3, type: 'textarea' },
      fieldName: 'remark',
      label: $t('system.workspace.remark'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<PlatformApi.PlatformItem>,
): VxeTableGridColumns<PlatformApi.PlatformItem> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('system.platform.name'), width: 150 },
    { field: 'code', title: $t('system.platform.code'), width: 150 },
    { field: 'baseUrl', title: $t('system.platform.baseUrl'), width: 250 },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.normal'), value: 1 },
          { color: 'error', label: $t('common.disabled'), value: 0 },
        ],
      },
      field: 'status',
      title: $t('common.status'),
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.yes'), value: 'Y' },
          { color: 'default', label: $t('common.no'), value: 'N' },
        ],
      },
      field: 'isDefault',
      title: $t('system.platform.isDefault'),
      width: 100,
    },
    { field: 'remark', title: $t('system.workspace.remark') },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.platform.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [{ code: 'setDefault', label: '设为默认' }, 'edit', 'delete'],
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

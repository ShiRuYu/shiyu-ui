import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { ModelApi } from '#/api/agent/model';

import { z } from '#/adapter/form';
import { getPlatformOptions } from '#/api/agent/platform';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getPlatformOptions,
        labelField: 'name',
        valueField: 'id',
      },
      fieldName: 'platformId',
      label: $t('system.model.platformId'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getPlatformOptions,
        labelField: 'name',
        valueField: 'id',
      },
      fieldName: 'platformId',
      label: $t('system.model.platformId'),
      rules: z
        .number()
        .min(1, $t('ui.formRules.required', [$t('system.model.platformId')])),
    },
    {
      component: 'Input',
      fieldName: 'modelName',
      label: $t('system.model.modelName'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.model.modelName')])),
    },
    {
      component: 'Input',
      fieldName: 'displayName',
      label: $t('system.model.displayName'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 500, rows: 2, type: 'textarea' },
      fieldName: 'description',
      label: $t('system.model.description'),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0 },
      defaultValue: 0,
      fieldName: 'sort',
      label: $t('system.model.sort'),
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
      label: $t('system.model.isDefault'),
    },
    {
      component: 'Input',
      componentProps: { maxlength: 2000, rows: 4, type: 'textarea' },
      fieldName: 'modelConfig',
      label: $t('system.model.modelConfig'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<ModelApi.ModelItem>,
): VxeTableGridColumns<ModelApi.ModelItem> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'platformName', title: $t('system.model.platformId'), width: 120 },
    { field: 'modelName', title: $t('system.model.modelName'), width: 200 },
    {
      field: 'displayName',
      title: $t('system.model.displayName'),
      width: 150,
    },
    {
      field: 'description',
      title: $t('system.model.description'),
      width: 200,
    },
    { field: 'sort', title: $t('system.model.sort'), width: 80 },
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
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.yes'), value: 'Y' },
          { color: 'default', label: $t('common.no'), value: 'N' },
        ],
      },
      field: 'isDefault',
      title: $t('system.model.isDefault'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'modelName',
          nameTitle: $t('system.model.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'chat', label: '对话' },
          { code: 'setDefault', label: '设为默认' },
          'edit',
          'delete',
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.role.operation'),
      width: 200,
    },
  ];
}

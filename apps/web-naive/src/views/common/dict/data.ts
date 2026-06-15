import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { DictApi } from '#/api/common/dict';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'dictType',
      label: $t('system.dict.dictType'),
    },
    {
      component: 'Input',
      fieldName: 'dictLabel',
      label: $t('system.dict.dictLabel'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'dictType',
      label: $t('system.dict.dictType'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.dict.dictType')])),
    },
    {
      component: 'Input',
      fieldName: 'dictLabel',
      label: $t('system.dict.dictLabel'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.dict.dictLabel')])),
    },
    {
      component: 'Input',
      fieldName: 'dictValue',
      label: $t('system.dict.dictValue'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.dict.dictValue')])),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0 },
      defaultValue: 0,
      fieldName: 'dictSort',
      label: $t('system.dict.dictSort'),
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
      component: 'Input',
      componentProps: { maxlength: 200, rows: 3, type: 'textarea' },
      fieldName: 'remark',
      label: $t('system.workspace.remark'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<DictApi.DictItem>,
): VxeTableGridColumns<DictApi.DictItem> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'dictType', title: $t('system.dict.dictType'), width: 150 },
    { field: 'dictLabel', title: $t('system.dict.dictLabel'), width: 150 },
    { field: 'dictValue', title: $t('system.dict.dictValue'), width: 150 },
    { field: 'dictSort', title: $t('system.dict.dictSort'), width: 80 },
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
    { field: 'remark', title: $t('system.workspace.remark') },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'dictLabel',
          nameTitle: $t('system.dict.name'),
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

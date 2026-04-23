import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemRoleApi } from '#/api/system/role';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

/**
 * 获取查询表单的字段配置
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('common.all'), value: '' },
          { label: $t('common.normal'), value: '1' },
          { label: $t('common.disabled'), value: '0' },
        ],
        optionType: 'button',
      },
      defaultValue: '',
      fieldName: 'status',
      label: $t('system.role.status'),
    },
  ];
}

/**
 * 获取编辑表单的字段配置
 */
export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.role.code'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.role.code')])),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.role.roleName'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.role.roleName')])),
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
      label: $t('system.role.status'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 100,
        rows: 3,
        showCount: true,
        type: 'textarea',
      },
      fieldName: 'remark',
      label: $t('system.role.remark'),
      rules: z
        .string()
        .max(100, $t('ui.formRules.maxLength', [$t('system.role.remark'), 100]))
        .optional(),
    },
    {
      component: 'Input',
      fieldName: 'permissions',
      formItemClass: 'items-start',
      label: $t('system.role.setPermissions'),
      modelPropName: 'modelValue',
    },
  ];
}

/**
 * 获取表格列配置
 */
export function useColumns(
  onActionClick?: OnActionClickFn<SystemRoleApi.SystemRole>,
): VxeTableGridColumns<SystemRoleApi.SystemRole> {
  return [
    {
      field: 'id',
      title: $t('system.role.id'),
      width: 100,
    },
    {
      field: 'code',
      title: $t('system.role.code'),
      width: 150,
    },
    {
      field: 'name',
      title: $t('system.role.roleName'),
      width: 150,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.normal'), value: '1' },
          { color: 'error', label: $t('common.disabled'), value: '0' },
        ],
      },
      field: 'status',
      title: $t('system.role.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.role.createTime'),
      width: 180,
    },
    {
      field: 'remark',
      title: $t('system.role.remark'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.role.name'),
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

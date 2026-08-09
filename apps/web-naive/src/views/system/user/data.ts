import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemUserApi } from '#/api/system/user';

import { useAccessStore } from '@vben/stores';

import { z } from '#/adapter/form';
import { getRolesForUserForm } from '#/api/system/user';
import { $t } from '#/locales';

/**
 * 获取查询表单的字段配置
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.username'),
    },
    {
      component: 'Input',
      fieldName: 'nickName',
      label: $t('system.user.nickname'),
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
      label: $t('system.user.status'),
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
      fieldName: 'username',
      label: $t('system.user.username'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.user.username')])),
    },
    {
      component: 'Input',
      fieldName: 'nickName',
      label: $t('system.user.nickname'),
      defaultValue: '',
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.user.nickname')])),
    },
    {
      component: 'Input',
      componentProps: {
        type: 'password',
        showPasswordOnClick: true,
        placeholder: $t('education.user.passwordPlaceholder'),
      },
      fieldName: 'password',
      label: $t('system.user.password'),
      defaultValue: '',
      dependencies: {
        resolve: ({ values }) => ({ if: !values.id }),
        triggerFields: ['id'],
      },
    },
    {
      component: 'Input',
      fieldName: 'email',
      label: $t('system.user.email'),
      rules: z.string().email($t('ui.formRules.email')).optional(),
    },
    {
      component: 'Input',
      fieldName: 'address',
      label: $t('system.user.address'),
      rules: z.string().max(255).optional(),
    },
    {
      component: 'Input',
      fieldName: 'phone',
      label: $t('system.user.phone'),
      rules: z
        .string()
        .regex(/^1[3-9]\d{9}$/, $t('ui.formRules.phone'))
        .optional(),
    },
    {
      component: 'Input',
      fieldName: 'avatar',
      label: $t('system.user.avatar'),
      rules: z.string().max(500).optional(),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: $t('system.user.sexMale'), value: '0' },
          { label: $t('system.user.sexFemale'), value: '1' },
          { label: $t('system.user.sexUnknown'), value: '2' },
        ],
        optionType: 'button',
      },
      defaultValue: '2',
      fieldName: 'gender',
      label: $t('system.user.sex'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getRolesForUserForm,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        multiple: true,
      },
      fieldName: 'roleIds',
      label: $t('system.user.role'),
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
      label: $t('system.user.status'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 200,
        rows: 3,
        showCount: true,
        type: 'textarea',
      },
      fieldName: 'remark',
      label: $t('system.user.remark'),
      rules: z
        .string()
        .max(200, $t('ui.formRules.maxLength', [$t('system.user.remark'), 200]))
        .optional(),
    },
  ];
}

/**
 * 获取表格列配置
 */
export function useColumns(
  onActionClick?: OnActionClickFn<SystemUserApi.SystemUser>,
): VxeTableGridColumns<SystemUserApi.SystemUser> {
  const accessStore = useAccessStore();
  const can = (code: string) => accessStore.accessCodes.includes(code);
  return [
    {
      field: 'id',
      title: 'ID',
      width: 80,
    },
    {
      field: 'username',
      title: $t('system.user.username'),
      width: 120,
    },
    {
      field: 'nickName',
      title: $t('system.user.nickname'),
      width: 120,
    },
    {
      field: 'email',
      title: $t('system.user.email'),
      width: 180,
    },
    {
      field: 'avatar',
      title: $t('system.user.avatar'),
      minWidth: 220,
      showOverflow: 'tooltip',
    },
    {
      field: 'address',
      title: $t('system.user.address'),
      minWidth: 180,
      showOverflow: 'tooltip',
    },
    {
      field: 'phone',
      title: $t('system.user.phone'),
      width: 120,
    },
    {
      field: 'remark',
      title: $t('system.user.remark'),
      minWidth: 180,
      showOverflow: 'tooltip',
    },
    {
      field: 'gender',
      formatter: ({ row }) => {
        switch (row.gender) {
          case '0': {
            return $t('system.user.sexMale');
          }
          case '1': {
            return $t('system.user.sexFemale');
          }
          default: {
            return $t('system.user.sexUnknown');
          }
        }
      },
      title: $t('system.user.sex'),
      width: 80,
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
      title: $t('system.user.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.user.createTime'),
      width: 180,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'username',
          nameTitle: $t('system.user.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'resetPassword',
            label: $t('system.user.resetPassword'),
            show: () => can('system:user:password'),
          },
          {
            code: 'assignTenant',
            label: $t('system.user.assignTenant'),
            show: () => can('system:user:update'),
          },
          { code: 'edit', show: () => can('system:user:update') },
          { code: 'delete', show: () => can('system:user:delete') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.user.operation'),
      width: 200,
    },
  ];
}

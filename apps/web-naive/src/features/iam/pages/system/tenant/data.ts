import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemTenantApi } from '#/features/iam/api';

import { useAccessStore } from '@vben/stores';

import { z } from '#/adapter/form';
import { getTenantTreeOptions } from '#/features/iam/api';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.tenant.tenantName'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.tenant.tenantCode'),
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
      label: $t('system.tenant.status'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getTenantTreeOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
        resultField: 'items',
      },
      fieldName: 'parentId',
      label: $t('system.tenant.parentTenant'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.tenant.tenantCode'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.tenant.tenantCode')])),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.tenant.tenantName'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.tenant.tenantName')])),
    },
    {
      component: 'Input',
      fieldName: 'contactName',
      label: $t('system.tenant.contactName'),
    },
    {
      component: 'Input',
      fieldName: 'contactPhone',
      label: $t('system.tenant.contactPhone'),
    },
    {
      component: 'Input',
      fieldName: 'address',
      label: $t('system.tenant.address'),
    },
    {
      component: 'Input',
      fieldName: 'domain',
      label: $t('system.tenant.domain'),
    },
    {
      component: 'Input',
      fieldName: 'intro',
      label: $t('system.tenant.intro'),
    },
    {
      component: 'Input',
      componentProps: {
        disabled: true,
      },
      defaultValue: 'tenant_super',
      dependencies: {
        resolve: ({ values }) => ({ if: !values.id }),
        triggerFields: ['id'],
      },
      fieldName: 'adminRoleCode',
      label: $t('system.tenant.adminRoleCode'),
    },
    {
      component: 'Input',
      defaultValue: $t('system.tenant.defaultAdminRoleName'),
      dependencies: {
        resolve: ({ values }) => ({ if: !values.id }),
        triggerFields: ['id'],
      },
      fieldName: 'adminRoleName',
      label: $t('system.tenant.adminRoleName'),
      rules: z
        .string()
        .min(
          1,
          $t('ui.formRules.required', [$t('system.tenant.adminRoleName')]),
        ),
    },
    {
      component: 'Input',
      dependencies: {
        resolve: ({ values }) => ({ if: !values.id }),
        triggerFields: ['id'],
      },
      fieldName: 'adminUsername',
      label: $t('system.tenant.adminUsername'),
    },
    {
      component: 'Input',
      componentProps: {
        showPasswordOnClick: true,
        type: 'password',
      },
      dependencies: {
        resolve: ({ values }) => ({ if: !values.id }),
        triggerFields: ['id'],
      },
      fieldName: 'adminPassword',
      label: $t('system.tenant.adminPassword'),
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
      label: $t('system.tenant.status'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<SystemTenantApi.SystemTenant>,
): VxeTableGridColumns<SystemTenantApi.SystemTenant> {
  const accessStore = useAccessStore();
  const can = (code: string) => accessStore.accessCodes.includes(code);
  return [
    {
      field: 'code',
      title: $t('system.tenant.tenantCode'),
      width: 120,
      treeNode: true,
    },
    {
      field: 'name',
      title: $t('system.tenant.tenantName'),
      width: 150,
    },
    {
      field: 'contactName',
      title: $t('system.tenant.contactName'),
      width: 120,
    },
    {
      field: 'contactPhone',
      title: $t('system.tenant.contactPhone'),
      width: 140,
    },
    {
      field: 'domain',
      title: $t('system.tenant.domain'),
      width: 180,
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
      title: $t('system.tenant.status'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.tenant.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', show: () => can('system:tenant:update') },
          { code: 'delete', show: () => can('system:tenant:delete') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.tenant.operation'),
      width: 160,
    },
  ];
}

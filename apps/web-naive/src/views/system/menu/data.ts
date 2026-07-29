import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import { useAccessStore } from '@vben/stores';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemMenuApi } from '#/api/system/menu';

import { z } from '#/adapter/form';
import { getMenuList } from '#/api/system/menu';
import { $t } from '#/locales';

/**
 * 获取菜单类型选项（带颜色）
 */
export function getMenuTypeOptions() {
  return [
    {
      color: 'processing',
      label: $t('system.menu.typeCatalog'),
      value: 'catalog',
    },
    { color: 'default', label: $t('system.menu.typeMenu'), value: 'menu' },
    {
      color: 'success',
      label: $t('system.menu.typeEmbedded'),
      value: 'embedded',
    },
    { color: 'warning', label: $t('system.menu.typeLink'), value: 'link' },
  ];
}

/**
 * 菜单类型选项
 */
const menuTypeOptions = [
  { label: $t('system.menu.typeCatalog'), value: 'catalog' },
  { label: $t('system.menu.typeMenu'), value: 'menu' },
  { label: $t('system.menu.typeEmbedded'), value: 'embedded' },
  { label: $t('system.menu.typeLink'), value: 'link' },
];

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.menu.menuName'),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.menu.code'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: menuTypeOptions,
      },
      fieldName: 'type',
      label: $t('system.menu.type'),
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
      fieldName: 'name',
      label: $t('system.menu.menuName'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.menu.menuName')])),
    },
    {
      component: 'Input',
      fieldName: 'code',
      label: $t('system.menu.code'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('system.menu.code')])),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getMenuList,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
      },
      fieldName: 'pid',
      label: $t('system.menu.parent'),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: menuTypeOptions,
        optionType: 'button',
      },
      defaultValue: 'menu',
      fieldName: 'type',
      label: $t('system.menu.type'),
    },
    {
      component: 'Input',
      fieldName: 'path',
      label: $t('system.menu.path'),
    },
    {
      component: 'Input',
      fieldName: 'component',
      label: $t('system.menu.component'),
      dependencies: {
        if(values) {
          return values.type === 'menu';
        },
        triggerFields: ['type'],
      },
    },
    {
      component: 'Input',
      fieldName: 'meta.title',
      label: $t('system.menu.menuTitle'),
    },
    {
      component: 'IconPicker',
      fieldName: 'meta.icon',
      label: $t('system.menu.icon'),
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'default', value: 'default' },
          { label: 'full-content', value: 'full-content' },
        ],
      },
      fieldName: 'layout',
      label: $t('system.menu.layout'),
      dependencies: {
        if(values) {
          return values.type === 'menu';
        },
        triggerFields: ['type'],
      },
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'DELETE', value: 'DELETE' },
        ],
      },
      fieldName: 'method',
      label: $t('system.menu.method'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 200,
        rows: 3,
        showCount: true,
        type: 'textarea',
      },
      fieldName: 'description',
      label: $t('system.menu.description'),
    },
    {
      component: 'Switch',
      defaultValue: true,
      fieldName: 'show',
      label: $t('system.menu.show'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
      },
      defaultValue: 0,
      fieldName: 'order',
      label: $t('system.menu.order'),
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'meta.hideInMenu',
      label: $t('system.menu.hideInMenu'),
    },
    {
      component: 'Switch',
      defaultValue: false,
      fieldName: 'meta.keepAlive',
      label: $t('system.menu.keepAlive'),
      dependencies: {
        if(values) {
          return values.type === 'menu';
        },
        triggerFields: ['type'],
      },
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
      label: $t('system.menu.status'),
    },
  ];
}

/**
 * 获取表格列配置
 */
export function useColumns(
  onActionClick?: OnActionClickFn<SystemMenuApi.SystemMenu>,
): VxeTableGridColumns<SystemMenuApi.SystemMenu> {
  const accessStore = useAccessStore();
  const can = (code: string) => accessStore.accessCodes.includes(code);
  return [
    {
      align: 'left',
      field: 'meta.title',
      fixed: 'left',
      title: $t('system.menu.menuTitle'),
      treeNode: true,
      width: 220,
    },
    {
      field: 'meta.icon',
      title: $t('system.menu.icon'),
      width: 80,
      slots: { default: 'icon' },
    },
    {
      align: 'center',
      cellRender: { name: 'CellTag', options: getMenuTypeOptions() },
      field: 'type',
      title: $t('system.menu.type'),
      width: 100,
    },
    {
      field: 'path',
      title: $t('system.menu.path'),
      width: 150,
    },
    {
      field: 'component',
      formatter: ({ row }) => {
        switch (row.type) {
          case 'catalog':
          case 'menu': {
            return row.component ?? '';
          }
          case 'embedded': {
            return row.meta?.iframeSrc ?? '';
          }
          case 'link': {
            return row.meta?.link ?? '';
          }
        }
        return '';
      },
      minWidth: 150,
      title: $t('system.menu.component'),
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
      title: $t('system.menu.status'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.menu.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            show: () => can('system:menu:create'),
            text: $t('system.menu.appendChild'),
          },
          { code: 'edit', show: () => can('system:menu:update') },
          { code: 'delete', show: () => can('system:menu:delete') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.menu.operation'),
      width: 200,
    },
  ];
}

import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { SystemWorkspaceApi } from '#/api/system/workspace';

import { z } from '#/adapter/form';
import { getWorkspaceList } from '#/api/system/workspace';
import { $t } from '#/locales';

/**
 * 获取查询表单的字段配置
 */
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.workspace.workspaceName'),
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
      label: $t('system.workspace.status'),
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
      label: $t('system.workspace.workspaceName'),
      rules: z
        .string()
        .min(
          2,
          $t('ui.formRules.minLength', [
            $t('system.workspace.workspaceName'),
            2,
          ]),
        )
        .max(
          20,
          $t('ui.formRules.maxLength', [
            $t('system.workspace.workspaceName'),
            20,
          ]),
        ),
    },
    {
      component: 'ApiTreeSelect',
      componentProps: {
        allowClear: true,
        api: getWorkspaceList,
        class: 'w-full',
        labelField: 'name',
        valueField: 'id',
        childrenField: 'children',
      },
      fieldName: 'pid',
      label: $t('system.workspace.parentWorkspace'),
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
      label: $t('system.workspace.status'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 50,
        rows: 3,
        showCount: true,
        type: 'textarea',
      },
      fieldName: 'remark',
      label: $t('system.workspace.remark'),
      rules: z
        .string()
        .max(
          50,
          $t('ui.formRules.maxLength', [$t('system.workspace.remark'), 50]),
        )
        .optional(),
    },
  ];
}

/**
 * 获取表格列配置
 */
export function useColumns(
  onActionClick?: OnActionClickFn<SystemWorkspaceApi.SystemWorkspace>,
): VxeTableGridColumns<SystemWorkspaceApi.SystemWorkspace> {
  return [
    {
      align: 'left',
      field: 'name',
      fixed: 'left',
      title: $t('system.workspace.workspaceName'),
      treeNode: true,
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
      title: $t('system.workspace.status'),
      width: 100,
    },
    {
      field: 'createTime',
      title: $t('system.workspace.createTime'),
      width: 180,
    },
    {
      field: 'remark',
      title: $t('system.workspace.remark'),
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('system.workspace.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'append',
            text: '新增下级',
          },
          'edit',
          {
            code: 'delete',
            disabled: (row: SystemWorkspaceApi.SystemWorkspace) => {
              return !!(row.children && row.children.length > 0);
            },
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('system.workspace.operation'),
      width: 200,
    },
  ];
}

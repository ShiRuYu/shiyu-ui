import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { TagApi } from '#/api/record/tag';

import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('record.tag.name') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('record.tag.name') },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<TagApi.Tag>,
): VxeTableGridColumns<TagApi.Tag> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('record.tag.name'), width: 200 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('record.tag.name'),
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

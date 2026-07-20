import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm, NTag } from 'naive-ui';

export function getTableColumns(onEdit: any, onDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '编码', key: 'code', width: 120 },
    { title: '名称', key: 'name', width: 160, ellipsis: { tooltip: true } },
    { title: '学段', key: 'gradeLevel', width: 100,
      render: (row) => h(NTag, { size: 'small', type: 'info' }, row.gradeLevel || '-'),
    },
    { title: '排序', key: 'sortOrder', width: 80 },
    { title: '状态', key: 'status', width: 80,
      render: (row) => h(NTag, { type: row.status === 1 ? 'success' : 'default' }, row.status === 1 ? '启用' : '停用'),
    },
    { title: '操作', key: 'actions', width: 180, align: 'center',
      render: (row) => h(NSpace, { justify: 'center' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => onDelete(row.id) },
          { default: () => '确认删除该学科？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}

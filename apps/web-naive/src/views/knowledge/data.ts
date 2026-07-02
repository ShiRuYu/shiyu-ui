import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm, NTag } from 'naive-ui';
import type { VbenFormSchema } from '#/adapter';

export function getTableColumns(onEdit: any, onDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '编码', key: 'code', width: 120 },
    { title: '名称', key: 'name', width: 200, ellipsis: { tooltip: true } },
    { title: '分类', key: 'category', width: 100,
      render: (row) => h(NTag, { size: 'small' }, row.category || '-'),
    },
    { title: '难度', key: 'difficulty', width: 80,
      render: (row) => {
        const map: Record<number, string> = { 1: '简单', 2: '中等', 3: '较难', 4: '困难' };
        return h(NTag, { size: 'small', type: row.difficulty >= 3 ? 'warning' : 'success' }, map[row.difficulty] || '-');
      },
    },
    { title: '标签', key: 'tags', width: 200, ellipsis: { tooltip: true } },
    { title: '状态', key: 'status', width: 80,
      render: (row) => h(NTag, { type: row.status === 1 ? 'success' : 'default' }, row.status === 1 ? '启用' : '停用'),
    },
    { title: '操作', key: 'actions', width: 220, align: 'center',
      render: (row) => h(NSpace, { justify: 'center' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => onDelete(row.id) },
          { default: () => '确认删除该知识点？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}

export function getSearchFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'category', label: '分类', componentProps: { placeholder: '如 MATH' } },
    { component: 'Input', fieldName: 'keyword', label: '关键词' },
  ];
}

export function getFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'code', label: '编码', rules: 'required' },
    { component: 'Input', fieldName: 'name', label: '名称', rules: 'required' },
    { component: 'Input', fieldName: 'category', label: '分类' },
    { component: 'InputNumber', fieldName: 'difficulty', label: '难度', componentProps: { min: 1, max: 4 }, defaultValue: 2 },
    { component: 'Input', fieldName: 'tags', label: '标签', componentProps: { placeholder: 'JSON数组，如 ["代数","函数"]' } },
    { component: 'Input', fieldName: 'description', label: '描述', componentProps: { type: 'textarea', rows: 3 } },
    { component: 'Switch', fieldName: 'status', label: '状态', defaultValue: true },
  ];
}

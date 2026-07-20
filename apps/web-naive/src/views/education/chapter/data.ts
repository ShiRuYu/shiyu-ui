import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm, NTag } from 'naive-ui';

export function getTableColumns(onEdit: any, onDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', width: 240, ellipsis: { tooltip: true } },
    { title: '排序', key: 'chapterOrder', width: 80 },
    { title: '父级ID', key: 'parentId', width: 100,
      render: (row) => row.parentId ? h(NTag, { size: 'small' }, String(row.parentId)) : h(NTag, { size: 'small', type: 'info' }, '根节点'),
    },
    { title: '子章节数', key: 'children', width: 100,
      render: (row) => h(NTag, { size: 'small', type: row.children?.length ? 'success' : 'default' }, String(row.children?.length || 0)),
    },
    { title: '操作', key: 'actions', width: 180, align: 'center',
      render: (row) => h(NSpace, { justify: 'center' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => onDelete(row.id) },
          { default: () => '确认删除该章节？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}

/** 将树形数据扁平化为表格行 */
export function flattenTree(tree: any[], depth: number = 0): any[] {
  const result: any[] = [];
  for (const node of tree) {
    result.push({ ...node, _depth: depth, _indent: '　'.repeat(depth) });
    if (node.children && node.children.length > 0) {
      result.push(...flattenTree(node.children, depth + 1));
    }
  }
  return result;
}

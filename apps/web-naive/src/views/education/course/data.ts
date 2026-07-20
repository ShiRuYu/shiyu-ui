import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm, NTag } from 'naive-ui';

const gradeMap: Record<number, string> = {
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
  7: '七年级', 8: '八年级', 9: '九年级', 10: '高一', 11: '高二', 12: '高三',
};

export function getTableColumns(onEdit: any, onDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', width: 200, ellipsis: { tooltip: true } },
    { title: '学科', key: 'subjectCode', width: 100,
      render: (row) => h(NTag, { size: 'small', type: 'info' }, row.subjectCode || '-'),
    },
    { title: '年级', key: 'grade', width: 100,
      render: (row) => h(NTag, { size: 'small' }, gradeMap[row.grade] || String(row.grade || '-')),
    },
    { title: '总课时', key: 'totalHours', width: 80 },
    { title: '状态', key: 'status', width: 80,
      render: (row) => h(NTag, { type: row.status === 1 ? 'success' : 'default' }, row.status === 1 ? '启用' : '停用'),
    },
    { title: '操作', key: 'actions', width: 180, align: 'center',
      render: (row) => h(NSpace, { justify: 'center' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => onDelete(row.id) },
          { default: () => '确认删除该课程？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}

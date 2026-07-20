import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm, NTag } from 'naive-ui';

const gradeMap: Record<number, string> = {
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
  7: '七年级', 8: '八年级', 9: '九年级', 10: '高一', 11: '高二', 12: '高三',
};

const difficultyMap: Record<number, { label: string; type: string }> = {
  1: { label: '简单', type: 'success' },
  2: { label: '中等', type: 'info' },
  3: { label: '较难', type: 'warning' },
  4: { label: '困难', type: 'error' },
};

export function getTableColumns(onEdit: any, onDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 70 },
    { title: '编码', key: 'code', width: 100 },
    { title: '类型', key: 'type', width: 90,
      render: (row) => h(NTag, { size: 'small', type: 'info' }, row.type || '-'),
    },
    { title: '标题', key: 'title', width: 260, ellipsis: { tooltip: true } },
    { title: '学科', key: 'subjectCode', width: 90,
      render: (row) => h(NTag, { size: 'small' }, row.subjectCode || '-'),
    },
    { title: '年级', key: 'grade', width: 90,
      render: (row) => h(NTag, { size: 'small' }, gradeMap[row.grade] || String(row.grade || '-')),
    },
    { title: '难度', key: 'difficulty', width: 80,
      render: (row) => {
        const d = difficultyMap[row.difficulty];
        return d ? h(NTag, { size: 'small', type: d.type as any }, d.label) : h(NTag, { size: 'small' }, '-');
      },
    },
    { title: '使用次数', key: 'usedCount', width: 80 },
    { title: '状态', key: 'status', width: 70,
      render: (row) => h(NTag, { type: row.status === 1 ? 'success' : 'default' }, row.status === 1 ? '启用' : '停用'),
    },
    { title: '操作', key: 'actions', width: 180, align: 'center',
      render: (row) => h(NSpace, { justify: 'center' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => onDelete(row.id) },
          { default: () => '确认删除该题目？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}

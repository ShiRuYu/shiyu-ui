import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ReviewTaskApi } from '#/api';

import { $t } from '#/locales';

export function useColumns<T = ReviewTaskApi.ReviewTask>(): VxeTableGridColumns {
  return [
    {
      field: 'knowledgeName',
      title: $t('education.reviewTask.knowledgeName'),
      minWidth: 150,
    },
    {
      field: 'reviewRound',
      title: $t('education.reviewTask.reviewRound'),
      width: 100,
    },
    {
      field: 'reviewDate',
      title: $t('education.reviewTask.reviewDate'),
      width: 130,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('education.reviewTask.status'),
      width: 100,
    },
    {
      field: 'previousMastery',
      title: $t('education.reviewTask.previousMastery'),
      width: 110,
      formatter: ({ cellValue }: any) =>
        cellValue != null ? `${(cellValue * 100).toFixed(0)}%` : '-',
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: $t('common.operation'),
      width: 160,
    },
  ];
}

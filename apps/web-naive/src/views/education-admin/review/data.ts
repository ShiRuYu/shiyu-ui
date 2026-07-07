import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationReviewApi } from '#/api/education/review';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'knowledgeName',
      label: $t('education.review.knowledgeName'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'knowledgeName',
      label: $t('education.review.knowledgeName'),
    },
    {
      component: 'InputNumber',
      fieldName: 'resultScore',
      label: $t('education.review.resultScore'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationReviewApi.ReviewTask>,
): VxeTableGridColumns<EducationReviewApi.ReviewTask> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'knowledgeName', title: $t('education.review.knowledgeName'), width: 200 },
    { field: 'reviewRound', title: $t('education.review.reviewRound'), width: 100 },
    { field: 'reviewDate', title: $t('education.review.reviewDate'), width: 120 },
    { field: 'resultScore', title: $t('education.review.resultScore'), width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'knowledgeName',
          nameTitle: $t('education.review.knowledgeName'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 120,
    },
  ];
}

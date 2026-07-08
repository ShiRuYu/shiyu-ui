import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationReviewApi } from '#/api/education/review';

import { getKnowledgeOptions } from '#/api/knowledge/knowledge';
import { getUserOptions } from '#/api/system/user';
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
      component: 'ApiSelect',
      componentProps: {
        api: getUserOptions,
        labelField: 'nickname',
        valueField: 'id',
        placeholder: $t('education.review.selectStudent'),
      },
      fieldName: 'studentId',
      label: $t('education.review.student'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getKnowledgeOptions,
        labelField: 'name',
        valueField: 'id',
        placeholder: $t('education.review.selectKnowledge'),
      },
      fieldName: 'knowledgeId',
      label: $t('education.review.knowledge'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'knowledgeName',
      label: $t('education.review.knowledgeName'),
    },
    {
      component: 'InputNumber',
      fieldName: 'reviewRound',
      label: $t('education.review.reviewRound'),
      defaultValue: 1,
    },
    {
      component: 'DatePicker',
      componentProps: {
        type: 'date',
        placeholder: $t('education.review.selectDate'),
      },
      fieldName: 'reviewDate',
      label: $t('education.review.reviewDate'),
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: $t('education.review.statusPending'), value: 'PENDING' },
          { label: $t('education.review.statusInReview'), value: 'IN_REVIEW' },
          { label: $t('education.review.statusCompleted'), value: 'COMPLETED' },
          { label: $t('education.review.statusFailed'), value: 'FAILED' },
        ],
        placeholder: $t('education.review.selectStatus'),
      },
      fieldName: 'status',
      label: $t('education.review.status'),
      defaultValue: 'PENDING',
    },
    {
      component: 'InputNumber',
      fieldName: 'resultScore',
      label: $t('education.review.resultScore'),
      componentProps: {
        min: 0,
        max: 100,
      },
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationReviewApi.ReviewTask>,
): VxeTableGridColumns<EducationReviewApi.ReviewTask> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'knowledgeName',
      title: $t('education.review.knowledgeName'),
      width: 200,
    },
    {
      field: 'reviewRound',
      title: $t('education.review.reviewRound'),
      width: 100,
    },
    {
      field: 'reviewDate',
      title: $t('education.review.reviewDate'),
      width: 120,
    },
    {
      field: 'resultScore',
      title: $t('education.review.resultScore'),
      width: 100,
    },
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

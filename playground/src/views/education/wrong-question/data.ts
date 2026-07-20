import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { WrongQuestionApi } from '#/api';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'questionTitle',
      label: $t('education.wrongQuestion.questionTitle'),
      rules: 'required',
    },
    {
      component: 'InputNumber',
      fieldName: 'questionId',
      label: $t('education.wrongQuestion.questionId'),
    },
    {
      component: 'InputNumber',
      fieldName: 'knowledgeId',
      label: $t('education.wrongQuestion.knowledgeId'),
    },
    {
      component: 'Textarea',
      fieldName: 'studentAnswer',
      label: $t('education.wrongQuestion.studentAnswer'),
    },
    {
      component: 'Textarea',
      fieldName: 'correctAnswer',
      label: $t('education.wrongQuestion.correctAnswer'),
    },
  ];
}

export function useColumns<T = WrongQuestionApi.WrongQuestion>(): VxeTableGridColumns {
  return [
    {
      field: 'questionTitle',
      title: $t('education.wrongQuestion.questionTitle'),
      minWidth: 220,
    },
    {
      field: 'questionId',
      title: $t('education.wrongQuestion.questionId'),
      width: 100,
    },
    {
      field: 'studentAnswer',
      title: $t('education.wrongQuestion.studentAnswer'),
      minWidth: 150,
    },
    {
      field: 'correctAnswer',
      title: $t('education.wrongQuestion.correctAnswer'),
      minWidth: 150,
    },
    {
      field: 'correctTimes',
      title: $t('education.wrongQuestion.correctTimes'),
      width: 100,
    },
    {
      align: 'center',
      field: 'operation',
      fixed: 'right',
      slots: { default: 'action' },
      title: $t('common.operation'),
      width: 180,
    },
  ];
}

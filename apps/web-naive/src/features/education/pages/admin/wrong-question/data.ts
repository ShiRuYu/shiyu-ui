import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationWrongQuestionApi } from '#/features/education/api';

import { getStudentOptions } from '#/features/education/api';
import { getQuestionOptions } from '#/features/education/api';
import { getKnowledgePointOptions } from '#/features/knowledge';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'studentAnswer',
      label: $t('education.wrongQuestion.studentAnswer'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: getStudentOptions,
        labelField: 'name',
        valueField: 'id',
        placeholder: $t('education.wrongQuestion.selectStudent'),
      },
      fieldName: 'studentId',
      label: $t('education.wrongQuestion.student'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getQuestionOptions,
        labelField: 'title',
        valueField: 'id',
        placeholder: $t('education.wrongQuestion.selectQuestion'),
      },
      fieldName: 'questionId',
      label: $t('education.wrongQuestion.question'),
      rules: 'required',
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: getKnowledgePointOptions,
        labelField: 'name',
        valueField: 'id',
        placeholder: $t('education.wrongQuestion.selectKnowledge'),
      },
      fieldName: 'knowledgeId',
      label: $t('education.wrongQuestion.knowledge'),
      rules: 'required',
    },
    {
      component: 'Input',
      fieldName: 'studentAnswer',
      label: $t('education.wrongQuestion.studentAnswer'),
    },
    {
      component: 'InputNumber',
      fieldName: 'correctTimes',
      label: $t('education.wrongQuestion.correctTimes'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationWrongQuestionApi.WrongQuestion>,
): VxeTableGridColumns<EducationWrongQuestionApi.WrongQuestion> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'questionId', title: '题目ID', width: 100 },
    {
      field: 'studentAnswer',
      title: $t('education.wrongQuestion.studentAnswer'),
      width: 200,
    },
    {
      field: 'correctTimes',
      title: $t('education.wrongQuestion.correctTimes'),
      width: 100,
    },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'id',
          nameTitle: 'ID',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: $t('common.operation'),
      width: 150,
    },
  ];
}

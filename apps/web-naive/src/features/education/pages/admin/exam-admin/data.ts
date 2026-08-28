import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationExamApi } from '#/features/education/api';

import { z } from '#/adapter/form';
import { getSubjectOptions } from '#/features/education/api';
import { getUserOptions } from '#/features/iam';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('education.exam.name') },
    {
      component: 'Input',
      fieldName: 'subjectCode',
      label: $t('education.course.subjectCode'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.exam.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('education.exam.name')])),
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: $t('education.exam.type'),
      componentProps: {
        options: [
          { label: $t('education.exam.typeDailyQuiz'), value: 'DAILY_QUIZ' },
          { label: $t('education.exam.typeUnitTest'), value: 'UNIT_TEST' },
          { label: $t('education.exam.typeMidterm'), value: 'MIDTERM' },
          { label: $t('education.exam.typeFinal'), value: 'FINAL' },
          { label: $t('education.exam.typeMock'), value: 'MOCK' },
          {
            label: $t('education.exam.typeAiGenerated'),
            value: 'AI_GENERATED',
          },
        ],
      },
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getSubjectOptions,
        class: 'w-full',
        labelField: 'name',
        valueField: 'code',
      },
      fieldName: 'subjectCode',
      label: $t('education.course.subjectCode'),
    },
    {
      component: 'InputNumber',
      fieldName: 'grade',
      label: $t('education.course.grade'),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        allowClear: true,
        api: getUserOptions,
        class: 'w-full',
        labelField: 'nickName',
        valueField: 'id',
      },
      fieldName: 'teacherId',
      label: $t('education.course.teacherId'),
    },
    {
      component: 'InputNumber',
      fieldName: 'durationMin',
      label: $t('education.exam.durationMin'),
    },
    {
      component: 'InputNumber',
      fieldName: 'totalScore',
      label: $t('education.exam.totalScore'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationExamApi.Exam>,
): VxeTableGridColumns<EducationExamApi.Exam> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.exam.name'), width: 180 },
    { field: 'type', title: $t('education.exam.type'), width: 100 },
    {
      field: 'subjectCode',
      title: $t('education.course.subjectCode'),
      width: 100,
    },
    { field: 'grade', title: $t('education.course.grade'), width: 80 },
    { field: 'teacherId', title: $t('education.course.teacherId'), width: 100 },
    {
      field: 'durationMin',
      title: $t('education.exam.durationMin'),
      width: 100,
    },
    { field: 'totalScore', title: $t('education.exam.totalScore'), width: 80 },
    { field: 'status', title: $t('system.user.status'), width: 80 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('education.exam.name'),
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

import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationQuestionApi } from '#/api/education/question';
import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'title', label: $t('education.question.questionTitle') },
    { component: 'Input', fieldName: 'subjectCode', label: $t('education.question.subjectCode') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input', fieldName: 'title', label: $t('education.question.questionTitle'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.question.questionTitle')])),
    },
    {
      component: 'Select', fieldName: 'type', label: $t('education.question.type'),
      componentProps: {
        options: [
          { label: $t('education.question.typeChoice'), value: 'CHOICE' },
          { label: $t('education.question.typeFill'), value: 'FILL' },
          { label: $t('education.question.typeSolve'), value: 'SOLVE' },
          { label: $t('education.question.typeJudge'), value: 'JUDGE' },
          { label: $t('education.question.typeEssay'), value: 'ESSAY' },
          { label: $t('education.question.typeExperiment'), value: 'EXPERIMENT' },
        ],
      },
    },
    { component: 'Input', fieldName: 'subjectCode', label: $t('education.question.subjectCode') },
    { component: 'InputNumber', fieldName: 'grade', label: $t('course.grade') },
    {
      component: 'Select', fieldName: 'difficulty', label: $t('education.question.difficulty'),
      componentProps: {
        options: [
          { label: $t('education.question.difficultyBasic'), value: 1 },
          { label: $t('education.question.difficultyMedium'), value: 2 },
          { label: $t('education.question.difficultyHard'), value: 3 },
          { label: $t('education.question.difficultyCompetition'), value: 4 },
        ],
      },
    },
    { component: 'Input', fieldName: 'abilityDimension', label: $t('education.question.abilityDimension') },
    {
      component: 'Input', componentProps: { type: 'textarea', rows: 3 }, fieldName: 'options', label: $t('education.question.options'),
    },
    {
      component: 'Input', componentProps: { type: 'textarea', rows: 3 }, fieldName: 'answer', label: $t('education.question.answer'),
    },
    {
      component: 'Input', componentProps: { type: 'textarea', rows: 3 }, fieldName: 'analysis', label: $t('education.question.analysis'),
    },
    { component: 'Input', fieldName: 'tags', label: $t('education.question.tags') },
  ];
}

export function useColumns(onActionClick?: OnActionClickFn<EducationQuestionApi.Question>): VxeTableGridColumns<EducationQuestionApi.Question> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: $t('education.question.code'), width: 120 },
    { field: 'type', title: $t('education.question.type'), width: 100 },
    {
      field: 'title', title: $t('education.question.questionTitle'), width: 250,
    },
    { field: 'subjectCode', title: $t('education.question.subjectCode'), width: 100 },
    { field: 'difficulty', title: $t('education.question.difficulty'), width: 80 },
    { field: 'usedCount', title: $t('education.question.usedCount'), width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'code', nameTitle: $t('education.question.name'), onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation', fixed: 'right', headerAlign: 'center',
      showOverflow: false, title: $t('common.operation'), width: 150,
    },
  ];
}

import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationCourseApi } from '#/api/education/course';
import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    { component: 'Input', fieldName: 'name', label: $t('education.course.name') },
    { component: 'Input', fieldName: 'subjectCode', label: $t('education.course.subjectCode') },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input', fieldName: 'name', label: $t('education.course.name'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.course.name')])),
    },
    {
      component: 'Input', fieldName: 'subjectCode', label: $t('education.course.subjectCode'),
      rules: z.string().min(1, $t('ui.formRules.required', [$t('education.course.subjectCode')])),
    },
    { component: 'InputNumber', fieldName: 'grade', label: $t('education.course.grade') },
    { component: 'InputNumber', fieldName: 'textbookId', label: $t('education.course.textbookId') },
    { component: 'InputNumber', fieldName: 'teacherId', label: $t('education.course.teacherId') },
    { component: 'Input', fieldName: 'coverUrl', label: $t('education.course.coverUrl') },
    { component: 'Input', fieldName: 'description', label: $t('education.course.description') },
    { component: 'InputNumber', fieldName: 'totalHours', label: $t('education.course.totalHours') },
  ];
}

export function useColumns(onActionClick?: OnActionClickFn<EducationCourseApi.Course>): VxeTableGridColumns<EducationCourseApi.Course> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.course.name'), width: 180 },
    { field: 'subjectCode', title: $t('education.course.subjectCode'), width: 100 },
    { field: 'grade', title: $t('education.course.grade'), width: 80 },
    { field: 'teacherId', title: $t('education.course.teacherId'), width: 100 },
    { field: 'totalHours', title: $t('education.course.totalHours'), width: 100 },
    { field: 'status', title: $t('system.user.status'), width: 80 },
    {
      align: 'right',
      cellRender: {
        attrs: { nameField: 'name', nameTitle: $t('education.course.name'), onClick: onActionClick },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation', fixed: 'right', headerAlign: 'center',
      showOverflow: false, title: $t('common.operation'), width: 150,
    },
  ];
}

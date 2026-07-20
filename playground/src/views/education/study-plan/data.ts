import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { StudyPlanApi } from '#/api';

import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.studyPlan.name'),
      rules: 'required',
    },
    {
      component: 'DatePicker',
      fieldName: 'startDate',
      label: $t('education.studyPlan.startDate'),
      rules: 'required',
    },
    {
      component: 'DatePicker',
      fieldName: 'endDate',
      label: $t('education.studyPlan.endDate'),
      rules: 'required',
    },
  ];
}

export function useColumns<T = StudyPlanApi.StudyPlan>(): VxeTableGridColumns {
  return [
    {
      field: 'name',
      title: $t('education.studyPlan.name'),
      minWidth: 180,
    },
    {
      field: 'startDate',
      title: $t('education.studyPlan.startDate'),
      width: 130,
    },
    {
      field: 'endDate',
      title: $t('education.studyPlan.endDate'),
      width: 130,
    },
    {
      cellRender: { name: 'CellTag' },
      field: 'status',
      title: $t('education.studyPlan.status'),
      width: 100,
    },
    {
      field: 'totalItems',
      title: $t('education.studyPlan.totalItems'),
      width: 100,
    },
    {
      field: 'completedItems',
      title: $t('education.studyPlan.completedItems'),
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

import type { VxeTableGridColumns } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { EducationPlanApi } from '#/api/education-admin/plan';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.plan.name'),
    },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('education.plan.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('education.plan.name')])),
    },
    {
      component: 'DatePicker',
      fieldName: 'startDate',
      label: $t('education.plan.startDate'),
    },
    {
      component: 'DatePicker',
      fieldName: 'endDate',
      label: $t('education.plan.endDate'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<EducationPlanApi.StudyPlan>,
): VxeTableGridColumns<EducationPlanApi.StudyPlan> {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'name', title: $t('education.plan.name'), width: 200 },
    { field: 'startDate', title: $t('education.plan.startDate'), width: 120 },
    { field: 'endDate', title: $t('education.plan.endDate'), width: 120 },
    { field: 'totalItems', title: $t('education.plan.totalItems'), width: 100 },
    { field: 'completedItems', title: $t('education.plan.completedItems'), width: 100 },
    {
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('education.plan.name'),
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

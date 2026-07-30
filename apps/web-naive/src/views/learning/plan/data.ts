import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

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
      componentProps: { valueFormat: 'yyyy-MM-dd' },
    },
    {
      component: 'DatePicker',
      fieldName: 'endDate',
      label: $t('education.plan.endDate'),
      componentProps: { valueFormat: 'yyyy-MM-dd' },
    },
  ];
}

export function getStatusType(status: number) {
  switch (status) {
    case 0: {
      return 'success' as const;
    }
    case 1: {
      return 'info' as const;
    }
    default: {
      return 'default' as const;
    }
  }
}

import type { VbenFormSchema } from '#/adapter/form';

import { z } from '#/adapter/form';
import { $t } from '#/locales';

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'agentId',
      label: 'Agent ID',
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', ['Agent ID'])),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('agent.name'),
      rules: z
        .string()
        .min(1, $t('ui.formRules.required', [$t('agent.name')])),
    },
    {
      component: 'Input',
      componentProps: { rows: 3, type: 'textarea' },
      fieldName: 'description',
      label: $t('agent.description'),
    },
    {
      component: 'Input',
      defaultValue: 'v1.0.0',
      fieldName: 'versionNumber',
      label: $t('agent.version'),
    },
    {
      component: 'Input',
      componentProps: { rows: 3, type: 'textarea' },
      fieldName: 'versionDescription',
      label: $t('agent.versionDescription'),
    },
  ];
}

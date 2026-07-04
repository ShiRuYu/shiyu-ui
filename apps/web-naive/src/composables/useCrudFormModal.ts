import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { $t } from '#/locales';

export function useCrudFormModal<T extends { id?: number; [key: string]: any }>(
  schema: VbenFormSchema[],
  createFn: (data: any) => Promise<any>,
  updateFn: (id: number, data: any) => Promise<any>,
  options?: {
    titleKey?: string;
    onSuccess?: () => void;
    width?: string;
  },
) {
  const { titleKey = 'name', onSuccess } = options ?? {};
  const formData = ref<T>();

  const getTitle = computed(() =>
    formData.value?.id
      ? $t('ui.actionTitle.edit', [$t(titleKey)])
      : $t('ui.actionTitle.create', [$t(titleKey)]),
  );

  const [Form, formApi] = useVbenForm({
    layout: 'vertical',
    schema,
    showDefaultActions: false,
  });

  const [Modal, modalApi] = useVbenModal({
    async onConfirm() {
      const { valid } = await formApi.validate();
      if (valid) {
        modalApi.lock();
        const data = await formApi.getValues();
        try {
          await (formData.value?.id
            ? updateFn(formData.value.id, data)
            : createFn(data));
          message.success($t('ui.actionMessage.operationSuccess'));
          modalApi.close();
          onSuccess?.();
        } catch (error) {
          console.error(error);
        } finally {
          modalApi.lock(false);
        }
      }
    },
    onOpenChange(isOpen) {
      if (isOpen) {
        const data = modalApi.getData<T>();
        formApi.resetForm();
        formData.value = data?.id ? data : undefined;
        if (data?.id) formApi.setValues(data);
      }
    },
  });

  return {
    Form,
    FormModal: Modal,
    formApi,
    modalApi,
    formData,
    getTitle,
    openCreate: () => modalApi.setData({} as T).open(),
    openEdit: (row: T) => modalApi.setData(row).open(),
  };
}

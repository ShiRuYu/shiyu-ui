<script lang="ts" setup>
import type { AuthCodeApi } from '#/api/system/auth-code';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { createAuthCode, updateAuthCode } from '#/api/system/auth-code';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<AuthCodeApi.AuthCodeItem>();

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.authCode.title')])
    : $t('ui.actionTitle.create', [$t('system.authCode.title')]);
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1',
  schema: useSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal<AuthCodeApi.AuthCodeItem>({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = (await formApi.getValues()) as {
        code: string;
        name: string;
      };
      try {
        await (formData.value?.id
          ? updateAuthCode(formData.value.id, data)
          : createAuthCode(data));
        message.success(
          formData.value?.id
            ? $t('ui.actionMessage.editSuccess', [$t('system.authCode.title')])
            : $t('ui.actionMessage.createSuccess', [
                $t('system.authCode.title'),
              ]),
        );
        modalApi.close();
        emit('success');
      } catch (error) {
        console.error(error);
      } finally {
        modalApi.lock(false);
      }
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      formApi.reset();
      formData.value = data?.id ? data : undefined;
      if (data?.id) formApi.setValues(data);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[92vw] max-w-[500px]">
    <Form />
  </Modal>
</template>

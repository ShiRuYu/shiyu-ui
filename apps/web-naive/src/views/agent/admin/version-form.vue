<script lang="ts" setup>
import type { AgentVersionApi } from '#/api/agent/version';

import { computed, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import {
  copyVersion,
  createVersion,
  getVersionList,
  updateVersion,
} from '#/api/agent/version';

const isEdit = ref(false);
const isCopy = ref(false);
const editData = ref<AgentVersionApi.AgentVersionVO>();
const copyOptions = ref<Array<{ label: string; value: number }>>([]);

const getTitle = computed(() => {
  if (isCopy.value) return '复制版本';
  if (isEdit.value) return '编辑版本';
  return '新建版本';
});

const schema = [
  {
    component: 'Input',
    fieldName: 'versionNumber',
    label: '版本号',
    rules: 'required' as any,
  },
  {
    component: 'Input',
    componentProps: { maxlength: 500, rows: 2, type: 'textarea' },
    fieldName: 'description',
    label: '描述',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      filterable: true,
      options: copyOptions,
      placeholder: '选择要复制的版本（可选）',
    },
    fieldName: 'copyFromVersionId',
    label: '复制源版本',
  },
];

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-1',
});

async function loadCopyOptions(agentId: string) {
  try {
    const list = (await getVersionList(agentId)) || [];
    copyOptions.value = list.map((v) => ({
      label: v.versionNumber,
      value: v.id,
    }));
  } catch {
    // ignore
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      const agentId = (modalApi.getData() as any)?.agentId || '';
      try {
        const versionId = editData.value?.id;
        if (isEdit.value && versionId) {
          await updateVersion(agentId, versionId, {
            versionNumber: data.versionNumber,
            description: data.description,
          });
        } else if (isCopy.value && versionId) {
          await copyVersion(agentId, versionId, {
            versionNumber: data.versionNumber,
            description: data.description,
          });
        } else if (data.copyFromVersionId) {
          await copyVersion(agentId, data.copyFromVersionId, {
            versionNumber: data.versionNumber,
            description: data.description,
          });
        } else {
          await createVersion(agentId, {
            versionNumber: data.versionNumber,
            description: data.description,
          });
        }
        message.success('操作成功');
        modalApi.close();
      } catch (error) {
        console.error(error);
      } finally {
        modalApi.lock(false);
      }
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const params = modalApi.getData() as any;
      const agentId = params?.agentId || '';
      isEdit.value = !!params?.isEdit;
      isCopy.value = !!params?.isCopy;
      editData.value = params?.editData;

      formApi.resetForm();
      await loadCopyOptions(agentId);
      await nextTick();

      if (isEdit.value && params?.editData) {
        formApi.setValues({
          versionNumber: params.editData.versionNumber,
          description: params.editData.description,
        });
      }
      if (isCopy.value && params?.editData) {
        formApi.setValues({
          versionNumber: '',
          description: params.editData.description,
        });
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[560px]">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="modalApi.close"> 取消 </NButton>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts" setup>
import type { TreeOption } from 'naive-ui';

import type { SystemRoleApi } from '#/api/system/role';

import { computed, h, nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { NButton, NSpin, NTree } from 'naive-ui';

import { useVbenForm } from '#/adapter/form';
import { message } from '#/adapter/naive';
import { getMenuList } from '#/api/system/menu';
import { createRole, updateRole } from '#/api/system/role';
import { $t } from '#/locales';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<SystemRoleApi.SystemRole>();
const menuTree = ref<any[]>([]);
const loadingMenu = ref(false);

const getTitle = computed(() => {
  return formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.role.name')])
    : $t('ui.actionTitle.create', [$t('system.role.name')]);
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  wrapperClass: 'grid-cols-1',
  schema: useSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.resetForm();
  formApi.setValues(formData.value || {});
}

async function loadMenuTree() {
  if (menuTree.value.length > 0) return;
  loadingMenu.value = true;
  try {
    const data = await getMenuList();
    menuTree.value = Array.isArray(data) ? data : [];
  } finally {
    loadingMenu.value = false;
  }
}

/** 自定义渲染菜单标签：显示图标 + meta.title */
function renderLabel({ option }: { option: TreeOption }) {
  const icon = (option as any).meta?.icon;
  const title = (option as any).meta?.title || option.label || option.key;
  if (icon) {
    return h('span', { class: 'flex items-center gap-1' }, [
      h(IconifyIcon, { icon, class: 'size-4 shrink-0' }),
      h('span', String(title)),
    ]);
  }
  return h('span', String(title));
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        const submitData = { ...data };
        // 确保 status 是字符串类型
        if (submitData.status !== undefined) {
          submitData.status = String(submitData.status);
        }
        await (formData.value?.id
          ? updateRole(formData.value.id, submitData)
          : createRole(submitData));
        message.success(
          formData.value?.id
            ? $t('ui.actionMessage.editSuccess', [$t('system.role.name')])
            : $t('ui.actionMessage.createSuccess', [$t('system.role.name')]),
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
      const data = modalApi.getData<SystemRoleApi.SystemRole>();
      formApi.resetForm();
      formData.value = data?.id ? data : undefined;
      // 首次加载菜单树
      await loadMenuTree();
      // 等待 Vue 更新 DOM，确保表单字段已挂载
      await nextTick();
      if (data?.id) {
        formApi.setValues(data);
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[640px]">
    <Form class="mx-4">
      <template #permissions="slotProps">
        <div class="w-full">
          <NSpin :show="loadingMenu">
            <div class="w-full rounded" style="min-height: 60px">
              <NTree
                :checked-keys="slotProps.modelValue || []"
                :data="menuTree"
                :default-expand-all="true"
                :render-label="renderLabel"
                block-line
                cascade
                checkable
                check-strategy="child"
                key-field="id"
                multiple
                style="width: 100%; padding: 4px 0"
                @update:checked-keys="
                  (keys) => slotProps['onUpdate:modelValue']?.(keys)
                "
              />
            </div>
          </NSpin>
        </div>
      </template>
    </Form>
    <template #prepend-footer>
      <div class="flex-auto">
        <NButton type="error" @click="resetForm">
          {{ $t('common.reset') }}
        </NButton>
      </div>
    </template>
  </Modal>
</template>

<script lang="ts" setup>
import type { AgentVersionApi } from '#/api/agent/version';

import { computed, h, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  NButton,
  NModal,
  NPopconfirm,
  NSpace,
  NSpin,
  NTable,
  NTag,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  activateVersion,
  archiveVersion,
  copyVersion,
  createVersion,
  deleteVersion,
  getVersionList,
  publishVersion,
} from '#/api/agent/version';

const emit = defineEmits(['success']);

const loading = ref(false);
const versions = ref<AgentVersionApi.AgentVersionVO[]>([]);
const agentId = ref('');

const showCreateModal = ref(false);
const newVersionNumber = ref('');
const newVersionDesc = ref('');

async function loadVersions() {
  if (!agentId.value) return;
  loading.value = true;
  try {
    versions.value = (await getVersionList(agentId.value)) || [];
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ agentId: string }>();
      agentId.value = data?.agentId || '';
      await loadVersions();
    }
  },
});

function statusType(s: string) {
  const map: Record<string, string> = {
    DRAFT: 'warning',
    PUBLISHED: 'success',
    ARCHIVED: 'default',
  };
  return map[s] || 'default';
}

function statusLabel(s: string) {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    PUBLISHED: '已发布',
    ARCHIVED: '已归档',
  };
  return map[s] || s;
}

async function handleCreate() {
  if (!agentId.value || !newVersionNumber.value) return;
  try {
    await createVersion(agentId.value, {
      versionNumber: newVersionNumber.value,
      description: newVersionDesc.value,
    });
    message.success('版本创建成功');
    showCreateModal.value = false;
    newVersionNumber.value = '';
    newVersionDesc.value = '';
    await loadVersions();
    emit('success');
  } catch {
    message.error('创建失败');
  }
}

async function handlePublish(version: AgentVersionApi.AgentVersionVO) {
  try {
    await publishVersion(agentId.value, version.id);
    message.success('版本已发布');
    await loadVersions();
    emit('success');
  } catch {
    message.error('发布失败');
  }
}

async function handleActivate(version: AgentVersionApi.AgentVersionVO) {
  try {
    await activateVersion(agentId.value, version.id);
    message.success('版本已激活');
    await loadVersions();
    emit('success');
  } catch {
    message.error('激活失败');
  }
}

async function handleArchive(version: AgentVersionApi.AgentVersionVO) {
  try {
    await archiveVersion(agentId.value, version.id);
    message.success('版本已归档');
    await loadVersions();
    emit('success');
  } catch {
    message.error('归档失败');
  }
}

async function handleDelete(version: AgentVersionApi.AgentVersionVO) {
  try {
    await deleteVersion(agentId.value, version.id);
    message.success('版本已删除');
    await loadVersions();
    emit('success');
  } catch {
    message.error('删除失败');
  }
}

async function handleCopy(version: AgentVersionApi.AgentVersionVO) {
  try {
    await copyVersion(agentId.value, version.id, {
      versionNumber: version.versionNumber + '-copy',
      copyFromVersionId: version.id,
    });
    message.success('版本已复制');
    await loadVersions();
    emit('success');
  } catch {
    message.error('复制失败');
  }
}

const columns = [
  { title: '版本号', key: 'versionNumber', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '描述', key: 'description', ellipsis: { tooltip: true } },
  { title: '创建时间', key: 'createTime', width: 180 },
  { title: '更新时间', key: 'updateTime', width: 180 },
  { title: '操作', key: 'actions', width: 360 },
];
</script>

<template>
  <Modal title="版本管理" class="w-[960px]">
    <div class="space-y-4">
      <NSpace align="center">
        <NButton type="primary" size="small" @click="showCreateModal = true">
          新建版本
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <NTable :columns="columns" :data="versions" size="small" bordered striped>
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key" :style="{ width: col.width }">
                {{ col.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="versions.length === 0">
              <td :colspan="columns.length" class="text-center text-gray-400 py-4">
                暂无版本
              </td>
            </tr>
            <tr v-for="version in versions" :key="version.id">
              <td>{{ version.versionNumber }}</td>
              <td>
                <NTag :bordered="false" :type="statusType(version.status)" size="small">
                  {{ statusLabel(version.status) }}
                </NTag>
              </td>
              <td>
                <span class="truncate block max-w-[200px]">{{ version.description || '-' }}</span>
              </td>
              <td>{{ version.createTime }}</td>
              <td>{{ version.updateTime }}</td>
              <td>
                <NSpace size="small">
                  <NButton
                    v-if="version.status === 'DRAFT'"
                    size="tiny"
                    type="primary"
                    @click="handlePublish(version)"
                  >
                    发布
                  </NButton>
                  <NButton
                    v-if="version.status === 'PUBLISHED'"
                    size="tiny"
                    type="success"
                    @click="handleActivate(version)"
                  >
                    激活
                  </NButton>
                  <NButton
                    v-if="version.status === 'PUBLISHED'"
                    size="tiny"
                    @click="handleArchive(version)"
                  >
                    归档
                  </NButton>
                  <NButton size="tiny" @click="handleCopy(version)">
                    复制
                  </NButton>
                  <NPopconfirm @positive-click="handleDelete(version)">
                    <template #trigger>
                      <NButton size="tiny" type="error">删除</NButton>
                    </template>
                    确认删除版本 <b>{{ version.versionNumber }}</b>？
                  </NPopconfirm>
                </NSpace>
              </td>
            </tr>
          </tbody>
        </NTable>
      </NSpin>
    </div>

    <NModal
      v-model:show="showCreateModal"
      preset="card"
      title="新建版本"
      class="w-[420px]"
    >
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">版本号</label>
          <input
            v-model="newVersionNumber"
            placeholder="如 v2.0.0"
            class="w-full rounded border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label class="text-sm font-medium">描述</label>
          <textarea
            v-model="newVersionDesc"
            placeholder="版本描述（可选）"
            rows="2"
            class="w-full rounded border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">取消</NButton>
          <NButton type="primary" @click="handleCreate">确定创建</NButton>
        </NSpace>
      </div>
    </NModal>
  </Modal>
</template>

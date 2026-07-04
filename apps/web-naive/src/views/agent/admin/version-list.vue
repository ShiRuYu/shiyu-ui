<script lang="ts" setup>
import type { AgentVersionApi } from '#/api/agent/version';

import { ref } from 'vue';

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

import { $t } from '#/locales';
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
    DRAFT: $t('agent.versionListDraft'),
    PUBLISHED: $t('agent.versionListPublishedText'),
    ARCHIVED: $t('agent.versionListArchivedText'),
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
    message.success($t('agent.versionListCreated'));
    showCreateModal.value = false;
    newVersionNumber.value = '';
    newVersionDesc.value = '';
    await loadVersions();
    emit('success');
  } catch {
    message.error($t('agent.versionListCreateFailed'));
  }
}

async function handlePublish(version: AgentVersionApi.AgentVersionVO) {
  try {
    await publishVersion(agentId.value, version.id);
    message.success($t('agent.versionListPublished'));
    await loadVersions();
    emit('success');
  } catch {
    message.error($t('agent.versionListPublishFailed'));
  }
}

async function handleActivate(version: AgentVersionApi.AgentVersionVO) {
  try {
    await activateVersion(agentId.value, version.id);
    message.success($t('agent.versionListActivated'));
    await loadVersions();
    emit('success');
  } catch {
    message.error($t('agent.versionListActivateFailed'));
  }
}

async function handleArchive(version: AgentVersionApi.AgentVersionVO) {
  try {
    await archiveVersion(agentId.value, version.id);
    message.success($t('agent.versionListArchived'));
    await loadVersions();
    emit('success');
  } catch {
    message.error($t('agent.versionListArchiveFailed'));
  }
}

async function handleDelete(version: AgentVersionApi.AgentVersionVO) {
  try {
    await deleteVersion(agentId.value, version.id);
    message.success($t('agent.versionListDeleted'));
    await loadVersions();
    emit('success');
  } catch {
    message.error($t('agent.versionListDeleteFailed'));
  }
}

async function handleCopy(version: AgentVersionApi.AgentVersionVO) {
  try {
    await copyVersion(agentId.value, version.id, {
      versionNumber: version.versionNumber + '-copy',
      copyFromVersionId: version.id,
    });
    message.success($t('agent.versionListCopied'));
    await loadVersions();
    emit('success');
  } catch {
    message.error($t('agent.versionListCopyFailed'));
  }
}

const columns = [
  { title: $t('agent.versionListVersionNumber'), key: 'versionNumber', width: 120 },
  { title: $t('agent.versionListStatus'), key: 'status', width: 100 },
  { title: $t('agent.versionListDescription'), key: 'description', ellipsis: { tooltip: true } },
  { title: $t('agent.versionListCreateTime'), key: 'createTime', width: 180 },
  { title: $t('agent.versionListUpdateTime'), key: 'updateTime', width: 180 },
  { title: $t('agent.versionListActions'), key: 'actions', width: 360 },
];
</script>

<template>
  <Modal :title="$t('agent.versionListTitle')" class="w-[960px]">
    <div class="space-y-4">
      <NSpace align="center">
        <NButton type="primary" size="small" @click="showCreateModal = true">
          {{ $t('agent.versionListCreate') }}
        </NButton>
      </NSpace>

      <NSpin :show="loading">
        <NTable
          :columns="columns"
          :data="versions"
          size="small"
          bordered
          striped
        >
          <thead>
            <tr>
              <th
                v-for="col in columns"
                :key="col.key"
                :style="{ width: col.width }"
              >
                {{ col.title }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="versions.length === 0">
              <td
                :colspan="columns.length"
                class="text-center text-gray-400 py-4"
              >
                {{ $t('agent.versionListEmpty') }}
              </td>
            </tr>
            <tr v-for="version in versions" :key="version.id">
              <td>{{ version.versionNumber }}</td>
              <td>
                <NTag
                  :bordered="false"
                  :type="statusType(version.status)"
                  size="small"
                >
                  {{ statusLabel(version.status) }}
                </NTag>
              </td>
              <td>
                <span class="truncate block max-w-[200px]">{{
                  version.description || '-'
                }}</span>
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
                    {{ $t('agent.versionListPublish') }}
                  </NButton>
                  <NButton
                    v-if="version.status === 'PUBLISHED'"
                    size="tiny"
                    type="success"
                    @click="handleActivate(version)"
                  >
                    {{ $t('agent.versionListActivate') }}
                  </NButton>
                  <NButton
                    v-if="version.status === 'PUBLISHED'"
                    size="tiny"
                    @click="handleArchive(version)"
                  >
                    {{ $t('agent.versionListArchive') }}
                  </NButton>
                  <NButton size="tiny" @click="handleCopy(version)">
                    {{ $t('agent.versionListCopy') }}
                  </NButton>
                  <NPopconfirm @positive-click="handleDelete(version)">
                    <template #trigger>
                      <NButton size="tiny" type="error">{{ $t('agent.versionListDelete') }}</NButton>
                    </template>
                    {{ $t('agent.versionListConfirmDelete', { versionNumber: version.versionNumber }) }}
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
      :title="$t('agent.versionListCreateModalTitle')"
      class="w-[420px]"
    >
      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">{{ $t('agent.versionListVersionNumberLabel') }}</label>
          <input
            v-model="newVersionNumber"
            :placeholder="$t('agent.versionListVersionNumberPlaceholder')"
            class="w-full rounded border border-input bg-background px-3 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label class="text-sm font-medium">{{ $t('agent.versionListDescriptionLabel') }}</label>
          <textarea
            v-model="newVersionDesc"
            :placeholder="$t('agent.versionListDescriptionPlaceholder')"
            rows="2"
            class="w-full rounded border border-input bg-background px-3 py-2 text-sm mt-1"
          ></textarea>
        </div>
        <NSpace justify="end">
          <NButton @click="showCreateModal = false">{{ $t('agent.cancel') }}</NButton>
          <NButton type="primary" @click="handleCreate">{{ $t('agent.versionListConfirmCreate') }}</NButton>
        </NSpace>
      </div>
    </NModal>
  </Modal>
</template>

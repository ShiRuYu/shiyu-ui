<script lang="ts" setup>
import { computed } from 'vue';

import { NButton, NInput, NPopconfirm, NSelect, NSpace, NTag } from 'naive-ui';

import { $t } from '#/locales';

interface VersionInfo {
  description: string;
  status: number;
  versionNumber: string;
}

const props = defineProps<{
  loading: boolean;
  readonly: boolean;
  selectedInfo: null | VersionInfo;
  statusLabel: (status: number) => string;
  versions: Array<{ label: string; value: number }>;
}>();

defineEmits<{
  activate: [];
  archive: [];
  create: [];
  delete: [];
  publish: [];
}>();
const selectedVersionId = defineModel<null | number>('selectedVersionId', {
  required: true,
});
const showCreate = defineModel<boolean>('showCreate', { required: true });
const newVersionNumber = defineModel<string>('newVersionNumber', {
  required: true,
});
const newVersionDescription = defineModel<string>('newVersionDescription', {
  required: true,
});

const canManageSelected = computed(
  () => Boolean(selectedVersionId.value) && !props.readonly,
);
</script>

<template>
  <div class="space-y-3">
    <NSpace vertical>
      <label class="text-sm font-medium" for="agent-version-select">
        {{ $t('agent.adminEditSelectVersion') }}
      </label>
      <div class="flex flex-wrap gap-2">
        <NSelect
          id="agent-version-select"
          v-model:value="selectedVersionId"
          :disabled="versions.length === 0 || readonly"
          :loading="loading"
          :options="versions"
          class="min-w-0 flex-1"
          :placeholder="$t('agent.adminEditSelectVersionPlaceholder')"
        />
        <NButton
          v-if="!readonly"
          size="small"
          @click="showCreate = !showCreate"
        >
          {{ $t('agent.adminEditCreateVersion') }}
        </NButton>
      </div>
    </NSpace>

    <div v-if="showCreate" class="rounded border p-2">
      <NSpace vertical>
        <NInput
          v-model:value="newVersionNumber"
          :placeholder="$t('agent.adminEditVersionNumberPlaceholder')"
          size="small"
        />
        <NInput
          v-model:value="newVersionDescription"
          :maxlength="500"
          :rows="1"
          :placeholder="$t('agent.adminEditVersionDescPlaceholder')"
          size="small"
          type="textarea"
        />
        <NButton size="small" type="primary" @click="$emit('create')">
          {{ $t('agent.adminEditConfirmCreate') }}
        </NButton>
      </NSpace>
    </div>

    <div
      v-if="selectedInfo"
      class="rounded bg-gray-50 p-2 text-xs dark:bg-gray-800"
    >
      <div>
        {{ $t('agent.adminEditVersionPrefix') }}:
        {{ selectedInfo.versionNumber }}
      </div>
      <div>
        {{ $t('agent.adminEditStatus') }}:
        <NTag :bordered="false" size="small">
          {{ statusLabel(selectedInfo.status) }}
        </NTag>
      </div>
      <div v-if="selectedInfo.description" class="mt-1">
        {{ $t('agent.description') }}: {{ selectedInfo.description }}
      </div>
    </div>

    <div v-if="canManageSelected" class="flex flex-wrap gap-2">
      <NButton
        v-if="selectedInfo?.status !== 1"
        size="small"
        type="primary"
        @click="$emit('publish')"
      >
        {{ $t('agent.adminEditPublish') }}
      </NButton>
      <NButton
        v-if="selectedInfo?.status === 1"
        size="small"
        type="success"
        @click="$emit('activate')"
      >
        {{ $t('agent.adminEditActivate') }}
      </NButton>
      <NButton
        v-if="selectedInfo?.status === 1"
        size="small"
        @click="$emit('archive')"
      >
        {{ $t('agent.adminEditArchive') }}
      </NButton>
      <NPopconfirm @positive-click="$emit('delete')">
        <template #trigger>
          <NButton size="small" type="error">
            {{ $t('agent.adminEditDeleteVersion') }}
          </NButton>
        </template>
        {{ $t('agent.adminEditConfirmDeleteVersion') }}
      </NPopconfirm>
    </div>
  </div>
</template>

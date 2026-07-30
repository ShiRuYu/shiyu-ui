<script lang="ts" setup>
import type { DataTableColumns, UploadFileInfo } from 'naive-ui';

import type { FileStorageConfig, StoredFile } from '#/api/system/upload';

import { h, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NIcon,
  NPopconfirm,
  NProgress,
  NSpace,
  NTag,
  NUpload,
  NUploadDragger,
} from 'naive-ui';

import { message } from '#/adapter/naive';
import {
  deleteFile,
  downloadFile,
  getFileList,
  getFileStorageConfig,
  uploadFile,
} from '#/api/system/upload';
import { $t } from '#/locales';

const files = ref<StoredFile[]>([]);
const storageConfig = ref<FileStorageConfig>();
const loading = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);

const storageLabels: Record<string, string> = {
  'aliyun-oss': 'Alibaba Cloud OSS',
  'local': $t('page.file.localStorage'),
  'minio': 'MinIO',
  's3': 'Amazon S3',
  'tencent-cos': 'Tencent Cloud COS',
};

async function loadData() {
  loading.value = true;
  try {
    const [config, list] = await Promise.all([
      getFileStorageConfig(),
      getFileList(),
    ]);
    storageConfig.value = config;
    files.value = Array.isArray(list) ? list : [];
  } finally {
    loading.value = false;
  }
}

function handleUpload({ file }: { file: UploadFileInfo }) {
  const rawFile = file.file;
  if (!rawFile) return false;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadFile({
    file: rawFile,
    onError: (error) => {
      uploading.value = false;
      message.error(error.message);
    },
    onProgress: ({ percent }) => {
      uploadProgress.value = percent;
    },
    onSuccess: (storedFile) => {
      files.value.unshift(storedFile);
      uploading.value = false;
      message.success($t('page.file.uploadSuccess'));
    },
  }).catch(() => undefined);
  return false;
}

async function handleDelete(file: StoredFile) {
  await deleteFile(file.key);
  files.value = files.value.filter((item) => item.key !== file.key);
  message.success($t('page.file.deleteSuccess'));
}

async function handleDownload(file: StoredFile) {
  await downloadFile(file);
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) {
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
  return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
}

const columns: DataTableColumns<StoredFile> = [
  { key: 'name', title: () => $t('page.file.fileName') },
  {
    key: 'size',
    render: (row) => formatSize(row.size),
    title: () => $t('page.file.size'),
    width: 120,
  },
  {
    key: 'storageType',
    render: (row) =>
      h(
        NTag,
        {
          size: 'small',
          type: row.storageType === 'local' ? 'success' : 'info',
        },
        { default: () => storageLabels[row.storageType] ?? row.storageType },
      ),
    title: () => $t('page.file.storageType'),
    width: 180,
  },
  {
    key: 'lastModified',
    render: (row) => new Date(row.lastModified).toLocaleString(),
    title: () => $t('page.file.uploadTime'),
    width: 190,
  },
  {
    key: 'actions',
    render: (row) =>
      h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleDownload(row),
              },
              { default: () => $t('page.file.download') },
            ),
            h(
              NPopconfirm,
              { onPositiveClick: () => handleDelete(row) },
              {
                default: () => $t('page.file.deleteConfirm'),
                trigger: () =>
                  h(
                    NButton,
                    { size: 'small', type: 'error' },
                    { default: () => $t('common.delete') },
                  ),
              },
            ),
          ],
        },
      ),
    title: () => $t('page.file.actions'),
    width: 180,
  },
];

onMounted(loadData);
</script>

<template>
  <Page :title="$t('page.file.title')">
    <NCard>
      <NAlert class="mb-4" type="info">
        <div class="flex flex-wrap items-center gap-2">
          <span>{{ $t('page.file.currentStorage') }}</span>
          <NTag type="success">
            {{
              storageLabels[storageConfig?.currentType ?? 'local'] ??
              storageConfig?.currentType
            }}
          </NTag>
          <span class="text-muted-foreground">
            {{ $t('page.file.storageConfiguredByServer') }}
          </span>
        </div>
      </NAlert>

      <NUpload
        :default-upload="false"
        :disabled="uploading"
        :multiple="true"
        @before-upload="handleUpload"
      >
        <NUploadDragger>
          <div class="flex flex-col items-center py-8">
            <NIcon size="48" color="#18a058">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"
                />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </NIcon>
            <p class="mt-2 text-base">{{ $t('page.file.uploadHint') }}</p>
            <p class="text-muted-foreground mt-1 text-sm">
              {{ $t('page.file.uploadDescription') }}
            </p>
          </div>
        </NUploadDragger>
      </NUpload>

      <NProgress
        v-if="uploading"
        :percentage="uploadProgress"
        indicator-placement="inside"
        processing
        class="mt-4"
      />

      <div class="mt-4 flex justify-end">
        <NButton :loading="loading" @click="loadData">
          {{ $t('common.refresh') }}
        </NButton>
      </div>

      <NDataTable
        class="mt-3"
        :columns="columns"
        :data="files"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        :row-key="(row: StoredFile) => row.key"
        striped
      />
    </NCard>
  </Page>
</template>

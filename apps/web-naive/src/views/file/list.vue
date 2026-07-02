<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NCard,
  NDataTable,
  NIcon,
  NProgress,
  NUpload,
  NUploadDragger,
} from 'naive-ui';

import { upload_file } from '#/api/system/upload';
import { $t } from '#/locales';

const files = ref<any[]>([]);
const uploading = ref(false);
const uploadProgress = ref(0);

function handleUpload({ file }: any) {
  uploading.value = true;
  uploadProgress.value = 0;
  upload_file({
    file,
    onProgress: (p) => {
      uploadProgress.value = p.percent;
    },
    onSuccess: (data, f) => {
      files.value.unshift({
        name: f.name,
        size: f.size,
        time: new Date().toLocaleString(),
        url: data?.url || '-',
      });
      uploading.value = false;
    },
    onError: () => {
      uploading.value = false;
    },
  });
  return false;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / 1048576).toFixed(1) + 'MB';
}

const columns = [
  { title: '文件名', key: 'name' },
  {
    title: '大小',
    key: 'size',
    width: 120,
    render: (row: any) => formatSize(row.size),
  },
  { title: '上传时间', key: 'time', width: 180 },
  { title: 'URL', key: 'url', ellipsis: { tooltip: true } },
];
</script>

<template>
  <Page :title="$t('page.file.title')">
    <NCard>
      <NUpload
        :default-upload="false"
        :multiple="false"
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
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </NIcon>
            <p class="mt-4 text-base">点击或拖拽文件到此区域上传</p>
          </div>
        </NUploadDragger>
      </NUpload>
      <NProgress
        v-if="uploading"
        class="mt-4"
        type="line"
        :percentage="uploadProgress"
        :show-indicator="true"
      />
    </NCard>

    <NCard class="mt-4" title="已上传文件">
      <NDataTable
        :columns="columns"
        :data="files"
        striped
        :row-key="(row: any) => row.name"
      />
      <div v-if="files.length === 0" class="py-10 text-center text-gray-400">
        暂无文件
      </div>
    </NCard>
  </Page>
</template>

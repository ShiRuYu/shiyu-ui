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
  // NaiveUI 的 file 是 UploadFileInfo，需要取其 .file 属性才是原生 File
  const rawFile: File | null = file?.file ?? file;
  if (!rawFile) return false;

  uploading.value = true;
  uploadProgress.value = 0;
  upload_file({
    file: rawFile,
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
            <p class="mt-2 text-base">点击或拖拽文件到此区域上传</p>
            <p class="text-muted-foreground mt-1 text-sm">
              支持任意格式文件
            </p>
          </div>
        </NUploadDragger>
      </NUpload>

      <NProgress
        v-if="uploading"
        :percentage="uploadProgress"
        :indicator-placement="'inside'"
        processing
        class="mt-4"
      />

      <NDataTable
        class="mt-4"
        :columns="columns"
        :data="files"
        :pagination="{ pageSize: 10 }"
        striped
      />
    </NCard>
  </Page>
</template>

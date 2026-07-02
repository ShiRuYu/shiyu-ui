<script lang="ts" setup>
import type { EducationResourceApi } from '#/api/education/resource';
import type { EducationSubjectApi } from '#/api/education/subject';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NGi, NGrid, NSelect, NSpace, NTag } from 'naive-ui';

import { getResourceList, getSubjectList } from '#/api';
import { $t } from '#/locales';

const loading = ref(false);
const resources = ref<EducationResourceApi.Resource[]>([]);
const subjects = ref<EducationSubjectApi.Subject[]>([]);
const filterSubject = ref<null | string>(null);
const filterType = ref<null | string>(null);

const typeOptions = [
  { label: '视频', value: 'VIDEO' },
  { label: '文档', value: 'DOCUMENT' },
  { label: '练习', value: 'EXERCISE' },
  { label: '互动', value: 'INTERACTIVE' },
];

async function loadSubjects() {
  try {
    subjects.value = await getSubjectList();
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

async function loadResources() {
  loading.value = true;
  try {
    let data = await getResourceList();
    if (filterSubject.value) {
      data = data.filter((r) => r.subjectCode === filterSubject.value);
    }
    if (filterType.value) {
      data = data.filter((r) => r.type === filterType.value);
    }
    resources.value = data;
  } catch (error) {
    console.error('Failed to load resources:', error);
  } finally {
    loading.value = false;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'DOCUMENT':
      return 'success';
    case 'EXERCISE':
      return 'warning';
    case 'INTERACTIVE':
      return 'error';
    case 'VIDEO':
      return 'info';
    default:
      return 'default';
  }
}

onMounted(() => {
  loadSubjects();
  loadResources();
});
</script>

<template>
  <Page :title="$t('page.learning.resource')">
    <template #extra>
      <NSpace>
        <NSelect
          v-model:value="filterSubject"
          :options="subjects.map((s) => ({ label: s.name, value: s.code }))"
          :placeholder="$t('education.course.subjectCode')"
          clearable
          style="width: 150px"
          @update:value="loadResources"
        />
        <NSelect
          v-model:value="filterType"
          :options="typeOptions"
          :placeholder="$t('education.resource.type')"
          clearable
          style="width: 120px"
          @update:value="loadResources"
        />
      </NSpace>
    </template>

    <NGrid :cols="4" :x-gap="16" :y-gap="16" responsive="screen">
      <NGi v-for="resource in resources" :key="resource.id">
        <NCard hoverable>
          <template #cover>
            <div
              v-if="resource.coverUrl"
              class="h-32 w-full bg-cover bg-center"
              :style="{ backgroundImage: `url(${resource.coverUrl})` }"
            ></div>
            <div
              v-else
              class="flex h-32 w-full items-center justify-center bg-gray-100"
            >
              <span class="text-3xl text-gray-300">📄</span>
            </div>
          </template>
          <template #header>
            <span class="line-clamp-1 text-sm font-medium">{{
              resource.name
            }}</span>
          </template>
          <template #header-extra>
            <NTag
              :type="getTypeColor(resource.type)"
              :bordered="false"
              size="small"
            >
              {{ resource.type }}
            </NTag>
          </template>
          <div class="text-xs text-gray-500">
            <div>{{ resource.subjectCode }} · {{ resource.grade }}年级</div>
            <div class="mt-1">浏览: {{ resource.viewCount || 0 }}</div>
          </div>
          <div
            v-if="resource.description"
            class="mt-2 line-clamp-2 text-xs text-gray-400"
          >
            {{ resource.description }}
          </div>
        </NCard>
      </NGi>
    </NGrid>

    <div
      v-if="!loading && resources.length === 0"
      class="py-20 text-center text-gray-400"
    >
      {{ $t('common.noData') }}
    </div>
  </Page>
</template>

<script lang="ts" setup>
import type { EducationResourceApi } from '#/api/education-admin/resource';
import type { EducationSubjectApi } from '#/api/education/subject';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NGi, NGrid, NSelect, NSpace, NTag } from 'naive-ui';

import { getResourceList, getSubjectList } from '#/api';
import { getDictByType } from '#/api/system/dict';
import { $t } from '#/locales';

const loading = ref(false);
const resources = ref<EducationResourceApi.Resource[]>([]);
const subjects = ref<EducationSubjectApi.Subject[]>([]);
const filterSubject = ref<null | string>(null);
const filterType = ref<null | string>(null);
const typeOptions = ref<Array<{ label: string; value: string }>>([]);

async function loadTypeOptions() {
  try {
    const data = await getDictByType('RESOURCE_TYPE');
    typeOptions.value = data.map((d: any) => ({
      label: d.dictLabel,
      value: d.dictValue,
    }));
  } catch (error) {
    console.error('Failed to load type options:', error);
  }
}

async function loadSubjects() {
  try {
    const result = await getSubjectList();
    subjects.value = result?.items || result || [];
  } catch (error) {
    console.error('Failed to load subjects:', error);
  }
}

async function loadResources() {
  loading.value = true;
  try {
    const result = await getResourceList();
    let data = result?.items || result || [];
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
    case 'DOCUMENT': {
      return 'success';
    }
    case 'EXERCISE': {
      return 'warning';
    }
    case 'INTERACTIVE': {
      return 'error';
    }
    case 'VIDEO': {
      return 'info';
    }
    default: {
      return 'default';
    }
  }
}

function openResource(resource: EducationResourceApi.Resource) {
  if (!resource.url) return;
  window.open(resource.url, '_blank', 'noopener,noreferrer');
}

onMounted(() => {
  loadTypeOptions();
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
        <NCard
          class="cursor-pointer"
          hoverable
          role="link"
          tabindex="0"
          @click="openResource(resource)"
          @keyup.enter="openResource(resource)"
        >
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

<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NInput, NSelect, NSpace, NSpin } from 'naive-ui';

import { chat, getDefaultModel, getPlatforms } from '#/api/agent/chat';

const platforms = ref<string[]>([]);
const selectedPlatform = ref<string>('SILICON_FLOW');
const defaultModel = ref('');
const prompt = ref('');
const response = ref('');
const loading = ref(false);

async function loadPlatforms() {
  try {
    platforms.value = (await getPlatforms()) || [];
    if (platforms.value.length > 0 && !selectedPlatform.value) {
      selectedPlatform.value = platforms.value[0] ?? '';
    }
  } catch {
    // ignore
  }
}

async function onPlatformChange(value: string) {
  selectedPlatform.value = value;
  await loadDefaultModel();
}

async function loadDefaultModel() {
  if (!selectedPlatform.value) return;
  try {
    const data = await getDefaultModel(selectedPlatform.value);
    defaultModel.value = data?.defaultModel || '';
  } catch {
    defaultModel.value = '';
  }
}

async function onSend() {
  if (!prompt.value.trim()) return;
  loading.value = true;
  response.value = '';
  try {
    const data = await chat({
      platform: selectedPlatform.value || undefined,
      prompt: prompt.value,
    });
    response.value = data?.content || '';
  } catch (error: any) {
    response.value = `Error: ${error?.message || error}`;
  } finally {
    loading.value = false;
  }
}

loadPlatforms();
</script>

<template>
  <Page auto-content-height>
    <NCard :title="$t('agent.chat')">
      <NSpace vertical :size="16">
        <div class="flex items-center gap-3">
          <NSelect
            v-model:value="selectedPlatform"
            :options="platforms.map((p) => ({ label: p, value: p }))"
            :style="{ width: '200px' }"
            placeholder="AI Platform"
            @update:value="onPlatformChange"
          />
          <span class="text-muted-foreground text-sm">
            Model: {{ defaultModel || 'default' }}
          </span>
        </div>
        <NInput
          v-model:value="prompt"
          :autosize="{ minRows: 3, maxRows: 8 }"
          :disabled="loading"
          :placeholder="$t('agent.promptPlaceholder')"
          type="textarea"
          @keydown.enter.exact.prevent="onSend"
        />
        <NSpace>
          <NButton :loading="loading" type="primary" @click="onSend">
            {{ $t('agent.send') }}
          </NButton>
        </NSpace>
        <NSpin v-if="loading" />
        <NCard
          v-if="response"
          :title="$t('agent.response')"
          embedded
          size="small"
        >
          <pre class="whitespace-pre-wrap font-mono text-sm">{{
            response
          }}</pre>
        </NCard>
      </NSpace>
    </NCard>
  </Page>
</template>

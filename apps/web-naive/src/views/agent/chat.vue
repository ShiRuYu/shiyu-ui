<script lang="ts" setup>
import type { ChatApi } from '#/api/agent/chat';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NInput,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
} from 'naive-ui';

import { chat, chatStream, getModelOptions } from '#/api/agent/chat';
import { getPlatformOptions } from '#/api/common/platform';

const platformOptions = ref<Array<{ label: string; value: number }>>([]);
const platformCodeMap = ref<Record<number, string>>({});
const modelOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedPlatformId = ref<number>();
const selectedModel = ref<string>();
const streamMode = ref(false);
const prompt = ref('');
const response = ref('');
const loading = ref(false);

async function loadPlatforms() {
  try {
    const list: ChatApi.OptionItem[] = (await getPlatformOptions()) || [];
    platformOptions.value = list.map((p) => ({ label: p.name, value: p.id }));
    const codeMap: Record<number, string> = {};
    for (const p of list) {
      if (p.code) codeMap[p.id] = p.code;
    }
    platformCodeMap.value = codeMap;
    if (list[0]?.id) {
      selectedPlatformId.value = list[0].id;
      await loadModels(list[0].id);
    }
  } catch {
    // ignore
  }
}

async function loadModels(platformId: number) {
  try {
    const list: ChatApi.OptionItem[] =
      (await getModelOptions(platformId)) || [];
    const mapped = list.map((m) => ({
      label: m.name || m.value || '',
      value: m.value || '',
    }));
    modelOptions.value = mapped;
    selectedModel.value = mapped[0]?.value ?? undefined;
  } catch {
    modelOptions.value = [];
    selectedModel.value = undefined;
  }
}

async function onPlatformChange(id: number) {
  selectedPlatformId.value = id;
  if (id) {
    await loadModels(id);
  } else {
    modelOptions.value = [];
    selectedModel.value = undefined;
  }
}

async function onSend() {
  if (!prompt.value.trim()) return;
  loading.value = true;
  response.value = '';
  try {
    const requestData: ChatApi.ChatRequest = {
      platform: selectedPlatformId.value
        ? platformCodeMap.value[selectedPlatformId.value]
        : undefined,
      model: selectedModel.value || undefined,
      prompt: prompt.value,
    };

    if (streamMode.value) {
      await chatStream(requestData, (text) => {
        response.value += text;
      });
    } else {
      const data = await chat(requestData);
      response.value = data?.content || '';
    }
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
            v-model:value="selectedPlatformId"
            :options="platformOptions"
            :style="{ width: '200px' }"
            placeholder="Platform"
            @update:value="onPlatformChange"
          />
          <NSelect
            v-model:value="selectedModel"
            :options="modelOptions"
            :style="{ width: '240px' }"
            placeholder="Model"
          />
          <NRadioGroup v-model:value="streamMode" size="small">
            <NRadio :value="false">Sync</NRadio>
            <NRadio :value="true">Stream</NRadio>
          </NRadioGroup>
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

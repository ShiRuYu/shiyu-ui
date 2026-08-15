<script lang="ts" setup>
import type { ChatApi } from '#/api/agent/chat';
import type { ModelApi } from '#/api/agent/model';

import { nextTick, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

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
import { getPlatformOptions } from '#/api/agent/platform';
import { $t } from '#/locales';

const platformOptions = ref<
  Array<{ code: string; label: string; value: number }>
>([]);
const modelOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedPlatformId = ref<number>();
const selectedModel = ref<string>();
const streamMode = ref(true);
const prompt = ref('');
const response = ref('');
const loading = ref(false);
const loadingPlatforms = ref(false);
const loadingModels = ref(false);
let controller: AbortController | undefined;

async function loadModels(platformId: number, row?: ModelApi.ModelItem) {
  loadingModels.value = true;
  modelOptions.value = [];
  selectedModel.value = undefined;
  try {
    const list: ChatApi.OptionItem[] =
      (await getModelOptions(platformId)) ?? [];
    modelOptions.value = list
      .filter((item) => item.value)
      .map((item) => ({
        label: item.name || item.value || '',
        value: item.value || '',
      }));
    selectedModel.value =
      modelOptions.value.find((item) => item.value === row?.modelName)?.value ??
      modelOptions.value[0]?.value;
  } finally {
    loadingModels.value = false;
  }
}

async function loadPlatforms(row?: ModelApi.ModelItem) {
  loadingPlatforms.value = true;
  try {
    const list = (await getPlatformOptions()) ?? [];
    platformOptions.value = list.map((item) => ({
      code: item.code,
      label: item.name,
      value: item.id,
    }));
    selectedPlatformId.value =
      platformOptions.value.find((item) => item.value === row?.platformId)
        ?.value ?? platformOptions.value[0]?.value;
    if (selectedPlatformId.value) {
      await loadModels(selectedPlatformId.value, row);
    }
  } catch {
    response.value = $t('ai-tutor.catalogError');
  } finally {
    loadingPlatforms.value = false;
  }
}

async function onPlatformChange(platformId: number) {
  await loadModels(platformId);
}

function stopGeneration() {
  controller?.abort();
}

async function onSend() {
  const platform = platformOptions.value.find(
    (item) => item.value === selectedPlatformId.value,
  )?.code;
  if (!prompt.value.trim() || !platform || !selectedModel.value) {
    response.value = $t('ai-tutor.selectionRequired');
    return;
  }

  loading.value = true;
  response.value = '';
  controller = new AbortController();
  try {
    const requestData: ChatApi.ChatRequest = {
      model: selectedModel.value,
      platform,
      prompt: prompt.value.trim(),
    };

    if (streamMode.value) {
      await chatStream(
        requestData,
        (text) => {
          response.value += text;
        },
        { signal: controller.signal },
      );
    } else {
      const data = await chat(requestData);
      response.value = data?.content || $t('ai-tutor.emptyResponse');
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      response.value ||= $t('ai-tutor.stopped');
    } else {
      const detail = error instanceof Error ? error.message : String(error);
      response.value = $t('ai-tutor.requestError', { message: detail });
    }
  } finally {
    loading.value = false;
    controller = undefined;
  }
}

const [FormModal, modalApi] = useVbenModal<ModelApi.ModelItem>({
  async onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      controller?.abort();
      return;
    }
    response.value = '';
    const row = modalApi.getData();
    await nextTick();
    await loadPlatforms(row);
  },
  title: $t('ai-tutor.directDebug'),
});
</script>

<template>
  <FormModal>
    <NCard embedded size="small" style="max-height: 70vh; overflow-y: auto">
      <NSpace vertical :size="12">
        <div class="model-toolbar">
          <NSelect
            v-model:value="selectedPlatformId"
            :aria-label="$t('ai-tutor.platform')"
            :disabled="loading"
            :loading="loadingPlatforms"
            :options="platformOptions"
            :placeholder="$t('ai-tutor.selectPlatform')"
            @update:value="onPlatformChange"
          />
          <NSelect
            v-model:value="selectedModel"
            :aria-label="$t('ai-tutor.model')"
            :disabled="loading || !selectedPlatformId"
            :loading="loadingModels"
            :options="modelOptions"
            :placeholder="$t('ai-tutor.selectModel')"
          />
          <NRadioGroup
            v-model:value="streamMode"
            :disabled="loading"
            size="small"
          >
            <NRadio :value="false">{{ $t('ai-tutor.syncMode') }}</NRadio>
            <NRadio :value="true">{{ $t('ai-tutor.streamMode') }}</NRadio>
          </NRadioGroup>
        </div>
        <NInput
          v-model:value="prompt"
          :autosize="{ minRows: 2, maxRows: 6 }"
          :disabled="loading"
          :placeholder="$t('ai-tutor.promptPlaceholder')"
          type="textarea"
          @keydown.enter.exact.prevent="onSend"
        />
        <NSpace>
          <NButton
            v-if="loading && streamMode"
            type="warning"
            @click="stopGeneration"
          >
            {{ $t('ai-tutor.stop') }}
          </NButton>
          <NButton
            v-else
            :disabled="!prompt.trim() || !selectedPlatformId || !selectedModel"
            :loading="loading"
            type="primary"
            @click="onSend"
          >
            {{ $t('ai-tutor.send') }}
          </NButton>
        </NSpace>
        <NSpin v-if="loading && !streamMode" />
        <NCard
          v-if="response"
          embedded
          size="small"
          :title="$t('ai-tutor.reply')"
        >
          <pre class="whitespace-pre-wrap font-mono text-sm">{{
            response
          }}</pre>
        </NCard>
      </NSpace>
    </NCard>
  </FormModal>
</template>

<style scoped>
.model-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto;
  gap: 0.75rem;
  align-items: center;
}

@media (max-width: 639px) {
  .model-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

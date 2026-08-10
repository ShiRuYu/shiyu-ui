<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { chat, chatStream, getModelOptions } from '#/api/agent/chat';
import { getPlatformOptions } from '#/api/agent/platform';
import { $t } from '#/locales';

const message = useMessage();

interface PlatformSelectOption {
  code: string;
  label: string;
  value: number;
}

const platforms = ref<PlatformSelectOption[]>([]);
const models = ref<Array<{ label: string; value: string }>>([]);
const platformId = ref<number>();
const model = ref<string>();
const prompt = ref('');
const mode = ref<'stream' | 'sync'>('sync');
const result = ref('');
const loading = ref(false);
const loadingPlatforms = ref(false);
const loadingModels = ref(false);
let controller: AbortController | undefined;
let modelRequestSequence = 0;

function getSelectedPlatformCode() {
  return platforms.value.find((item) => item.value === platformId.value)?.code;
}

async function loadModels(selectedPlatformId: number) {
  const requestSequence = ++modelRequestSequence;
  loadingModels.value = true;
  model.value = undefined;
  models.value = [];

  try {
    const list = await getModelOptions(selectedPlatformId);
    if (requestSequence !== modelRequestSequence) return;

    models.value = (list ?? [])
      .filter((item) => item.value)
      .map((item) => ({
        label: item.name || item.value || '',
        value: item.value || '',
      }));
    model.value = models.value[0]?.value;
  } catch {
    if (requestSequence === modelRequestSequence) {
      message.error($t('agent.chatConfigCatalogError'));
    }
  } finally {
    if (requestSequence === modelRequestSequence) {
      loadingModels.value = false;
    }
  }
}

async function loadPlatforms() {
  loadingPlatforms.value = true;
  try {
    const list = await getPlatformOptions();
    platforms.value = (list ?? []).map((item) => ({
      code: item.code,
      label: item.name,
      value: item.id,
    }));
    platformId.value =
      platforms.value.find((item) => item.code === 'SILICON_FLOW')?.value ??
      platforms.value[0]?.value;

    if (platformId.value) {
      await loadModels(platformId.value);
    }
  } catch {
    message.error($t('agent.chatConfigCatalogError'));
  } finally {
    loadingPlatforms.value = false;
  }
}

async function handlePlatformChange(selectedPlatformId: null | number) {
  if (selectedPlatformId === null) {
    model.value = undefined;
    models.value = [];
    return;
  }
  await loadModels(selectedPlatformId);
}

function stopStream() {
  controller?.abort();
}

function clearConversation() {
  stopStream();
  prompt.value = '';
  result.value = '';
}

async function handleSend() {
  const platform = getSelectedPlatformCode();
  if (!platform || !model.value) {
    message.warning($t('agent.chatConfigSelectPlatformModel'));
    return;
  }
  if (!prompt.value.trim()) {
    message.warning($t('agent.chatConfigInputPrompt'));
    return;
  }
  loading.value = true;
  result.value = '';

  try {
    const request = {
      model: model.value,
      platform,
      prompt: prompt.value.trim(),
    };
    if (mode.value === 'sync') {
      const res = await chat(request);
      result.value = res?.content || JSON.stringify(res);
    } else {
      controller = new AbortController();
      await chatStream(
        request,
        (text: string) => {
          result.value += text;
        },
        { signal: controller.signal },
      );
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      result.value ||= $t('agent.chatStopped');
      return;
    }
    result.value = $t('agent.chatConfigError', {
      message: error.message || $t('agent.chatConfigUnknownError'),
    });
  } finally {
    controller = undefined;
    loading.value = false;
  }
}

onMounted(loadPlatforms);
onBeforeUnmount(stopStream);
</script>

<template>
  <NCard :title="$t('agent.chatConfigTitle')" :bordered="false" class="h-full">
    <NForm label-placement="left" label-width="100">
      <NFormItem :label="$t('agent.chatConfigPlatform')">
        <NSelect
          v-model:value="platformId"
          class="catalog-select"
          :aria-label="$t('agent.chatConfigPlatform')"
          :disabled="loading"
          :loading="loadingPlatforms"
          :options="platforms"
          :placeholder="$t('agent.chatConfigSelectPlatform')"
          filterable
          @update:value="handlePlatformChange"
        />
      </NFormItem>
      <NFormItem :label="$t('agent.chatConfigModel')">
        <NSelect
          v-model:value="model"
          class="catalog-select"
          :aria-label="$t('agent.chatConfigModel')"
          :disabled="loading || !platformId"
          :loading="loadingModels"
          :options="models"
          :placeholder="$t('agent.chatConfigSelectModel')"
          filterable
        />
      </NFormItem>
      <NFormItem :label="$t('agent.chatConfigMode')">
        <NRadioGroup v-model:value="mode">
          <NRadio value="sync">{{ $t('agent.chatConfigSync') }}</NRadio>
          <NRadio value="stream">{{ $t('agent.chatConfigStream') }}</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem :label="$t('agent.chatConfigPrompt')">
        <NInput
          v-model:value="prompt"
          type="textarea"
          rows="4"
          :placeholder="$t('agent.chatConfigPromptPlaceholder')"
        />
      </NFormItem>
      <NFormItem>
        <NSpace>
          <NButton
            v-if="loading && mode === 'stream'"
            type="warning"
            @click="stopStream"
          >
            {{ $t('agent.chatStop') }}
          </NButton>
          <NButton
            v-else
            type="primary"
            :disabled="
              !platformId || !model || loadingPlatforms || loadingModels
            "
            :loading="loading"
            @click="handleSend"
          >
            {{ $t('agent.chatConfigSend') }}
          </NButton>
          <NButton :disabled="loading" @click="clearConversation">
            {{ $t('agent.chatConfigClear') }}
          </NButton>
        </NSpace>
      </NFormItem>
    </NForm>
    <NCard
      v-if="result"
      :title="$t('agent.chatConfigResult')"
      size="small"
      class="mt-4"
    >
      <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
    </NCard>
  </NCard>
</template>

<style scoped>
.catalog-select {
  width: min(100%, 20rem);
}
</style>

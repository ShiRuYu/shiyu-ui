<script lang="ts" setup>
import type { ModelApi } from '#/api/common/model';
import type { ChatApi } from '#/api/agent/chat';

import { ref, watch } from 'vue';

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

const [FormModal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  title: 'AI 对话',
});

// 监听弹窗打开，加载平台列表并预填
watch(
  () => modalApi.isOpen,
  async (isOpen) => {
    if (!isOpen) return;
    const row = modalApi.getData<ModelApi.ModelItem>();
    await loadPlatforms(row);
  },
  { immediate: false },
);

async function loadPlatforms(row?: ModelApi.ModelItem) {
  try {
    const list: ChatApi.OptionItem[] = (await getPlatformOptions()) || [];
    platformOptions.value = list.map((p) => ({
      label: p.name,
      value: p.id,
    }));
    const codeMap: Record<number, string> = {};
    for (const p of list) {
      if (p.code) codeMap[p.id] = p.code;
    }
    platformCodeMap.value = codeMap;

    // 预填：使用当前行的 platformId
    if (row?.platformId) {
      selectedPlatformId.value = row.platformId;
      await loadModels(row.platformId, row);
    } else if (list[0]?.id) {
      selectedPlatformId.value = list[0].id;
      await loadModels(list[0].id);
    }
  } catch {
    // ignore
  }
}

async function loadModels(platformId: number, row?: ModelApi.ModelItem) {
  try {
    const list: ChatApi.OptionItem[] =
      (await getModelOptions(platformId)) || [];
    const mapped = list.map((m) => ({
      label: m.name || m.value || '',
      value: m.value || '',
    }));
    modelOptions.value = mapped;

    // 预填：使用当前行的 modelName
    if (row?.modelName) {
      const matched = mapped.find((m) => m.value === row.modelName);
      if (matched) {
        selectedModel.value = matched.value;
        return;
      }
    }
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
</script>

<template>
  <FormModal>
    <NCard embedded size="small" style="max-height: 70vh; overflow-y: auto">
      <NSpace vertical :size="12">
        <div class="flex items-center gap-3">
          <NSelect
            v-model:value="selectedPlatformId"
            :options="platformOptions"
            :style="{ width: '180px' }"
            placeholder="平台"
            @update:value="onPlatformChange"
          />
          <NSelect
            v-model:value="selectedModel"
            :options="modelOptions"
            :style="{ width: '220px' }"
            placeholder="模型"
          />
          <NRadioGroup v-model:value="streamMode" size="small">
            <NRadio :value="false">同步</NRadio>
            <NRadio :value="true">流式</NRadio>
          </NRadioGroup>
        </div>
        <NInput
          v-model:value="prompt"
          :autosize="{ minRows: 2, maxRows: 6 }"
          :disabled="loading"
          placeholder="输入对话内容..."
          type="textarea"
          @keydown.enter.exact.prevent="onSend"
        />
        <NSpace>
          <NButton :loading="loading" type="primary" @click="onSend">
            发送
          </NButton>
        </NSpace>
        <NSpin v-if="loading" />
        <NCard
          v-if="response"
          embedded
          size="small"
          title="回复"
        >
          <pre class="whitespace-pre-wrap font-mono text-sm">{{
            response
          }}</pre>
        </NCard>
      </NSpace>
    </NCard>
  </FormModal>
</template>

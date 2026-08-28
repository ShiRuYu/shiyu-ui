<script lang="ts" setup>
import type { AgentApi } from '#/features/agent/api';

import { onBeforeUnmount, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NInput, NRadio, NRadioGroup, NSpace, NSpin } from 'naive-ui';

import { executeAgent, executeAgentStream } from '#/features/agent/api';
import { $t } from '#/locales';

const agentData = ref<AgentApi.AgentDefinition>();
const streamMode = ref(false);
const prompt = ref('');
const response = ref('');
const loading = ref(false);
let controller: AbortController | undefined;

const [Modal, modalApi] = useVbenModal<AgentApi.AgentDefinition>({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      agentData.value = data;
      prompt.value = '';
      response.value = '';
    } else {
      controller?.abort();
    }
  },
});

async function onSend() {
  if (!prompt.value.trim() || !agentData.value) return;
  loading.value = true;
  response.value = '';
  controller = new AbortController();
  try {
    const requestData = { input: prompt.value };

    if (streamMode.value) {
      await executeAgentStream(
        agentData.value.agentId,
        requestData,
        (text) => {
          response.value += text;
        },
        { signal: controller.signal },
      );
    } else {
      const data = await executeAgent(agentData.value.agentId, requestData);
      response.value = data?.output || JSON.stringify(data, null, 2);
    }
  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      response.value = $t('agent.chatConfigError', {
        message: error?.message || String(error),
      });
    } else if (!response.value) {
      response.value = $t('agent.chatStopped');
    }
  } finally {
    loading.value = false;
    controller = undefined;
  }
}

function stopGeneration() {
  controller?.abort();
}

onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <Modal
    :title="`${$t('agent.chat')} - ${agentData?.name || ''}`"
    class="w-[94vw] max-w-[800px]"
  >
    <div class="mx-4">
      <NSpace vertical :size="16">
        <div class="flex items-center gap-3">
          <NRadioGroup v-model:value="streamMode" size="small">
            <NRadio :value="false">{{ $t('agent.chatConfigSync') }}</NRadio>
            <NRadio :value="true">{{ $t('agent.chatConfigStream') }}</NRadio>
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
          <NButton v-if="!loading" type="primary" @click="onSend">
            {{ $t('agent.send') }}
          </NButton>
          <NButton v-else type="warning" @click="stopGeneration">
            {{ $t('agent.chatStop') }}
          </NButton>
        </NSpace>
        <NSpin v-if="loading" />
        <div
          v-if="response"
          class="bg-muted mt-4 max-h-[400px] overflow-auto rounded-md p-4"
          aria-live="polite"
          role="status"
        >
          <pre class="whitespace-pre-wrap font-mono text-sm">{{
            response
          }}</pre>
        </div>
      </NSpace>
    </div>
  </Modal>
</template>

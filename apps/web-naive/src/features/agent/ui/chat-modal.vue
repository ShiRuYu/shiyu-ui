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

function leaveCurrentChat() {
  const previous = controller;
  controller = undefined;
  previous?.abort();
  loading.value = false;
}

const [Modal, modalApi] = useVbenModal<AgentApi.AgentDefinition>({
  async onOpenChange(isOpen) {
    leaveCurrentChat();
    if (isOpen) {
      const data = modalApi.getData();
      agentData.value = data;
      prompt.value = '';
      response.value = '';
    }
  },
});

async function onSend() {
  if (loading.value || !prompt.value.trim() || !agentData.value) return;
  const agentId = agentData.value.agentId;
  const requestController = new AbortController();
  controller = requestController;
  loading.value = true;
  response.value = '';
  try {
    const requestData = { input: prompt.value };

    if (streamMode.value) {
      await executeAgentStream(
        agentId,
        requestData,
        (text) => {
          if (
            controller === requestController &&
            !requestController.signal.aborted
          ) {
            response.value += text;
          }
        },
        { signal: requestController.signal },
      );
    } else {
      const data = await executeAgent(agentId, requestData, {
        signal: requestController.signal,
      });
      if (
        controller === requestController &&
        !requestController.signal.aborted
      ) {
        response.value = data?.output || JSON.stringify(data, null, 2);
      }
    }
  } catch (error: any) {
    const cancelled =
      requestController.signal.aborted ||
      error?.name === 'AbortError' ||
      error?.code === 'ERR_CANCELED';
    if (controller !== requestController) return;
    if (!cancelled) {
      response.value = $t('agent.chatConfigError', {
        message: error?.message || String(error),
      });
    } else if (!response.value) {
      response.value = $t('agent.chatStopped');
    }
  } finally {
    if (controller === requestController) {
      loading.value = false;
      controller = undefined;
    }
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

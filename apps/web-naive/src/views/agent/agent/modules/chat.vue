<script lang="ts" setup>
import type { AgentApi } from '#/api/agent/agent';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { NButton, NInput, NRadio, NRadioGroup, NSpace, NSpin } from 'naive-ui';

import { executeAgent, executeAgentStream } from '#/api/agent/agent';
import { $t } from '#/locales';

const agentData = ref<AgentApi.AgentDefinition>();
const streamMode = ref(false);
const prompt = ref('');
const response = ref('');
const loading = ref(false);

const [Modal, modalApi] = useVbenModal<AgentApi.AgentDefinition>({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      agentData.value = data;
      prompt.value = '';
      response.value = '';
    }
  },
});

async function onSend() {
  if (!prompt.value.trim() || !agentData.value) return;
  loading.value = true;
  response.value = '';
  try {
    const requestData = { input: prompt.value };

    if (streamMode.value) {
      await executeAgentStream(agentData.value.agentId, requestData, (text) => {
        response.value += text;
      });
    } else {
      const data = await executeAgent(agentData.value.agentId, requestData);
      response.value = data?.output || JSON.stringify(data, null, 2);
    }
  } catch (error: any) {
    response.value = `Error: ${error?.message || error}`;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :title="`${$t('agent.chat')} - ${agentData?.name || ''}`"
    class="w-[800px]"
  >
    <div class="mx-4">
      <NSpace vertical :size="16">
        <div class="flex items-center gap-3">
          <NRadioGroup v-model:value="streamMode" size="small">
            <NRadio :value="false">同步</NRadio>
            <NRadio :value="true">流式</NRadio>
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
        <div
          v-if="response"
          class="bg-muted mt-4 max-h-[400px] overflow-auto rounded-md p-4"
        >
          <pre class="whitespace-pre-wrap font-mono text-sm">{{
            response
          }}</pre>
        </div>
      </NSpace>
    </div>
  </Modal>
</template>

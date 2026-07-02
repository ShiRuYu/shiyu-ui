<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NInput, NSpace } from 'naive-ui';

import { chat } from '#/api/agent/chat';
import { $t } from '#/locales';

const messages = ref<{ content: string; role: string; }[]>([]);
const input = ref('');
const loading = ref(false);

async function sendMessage() {
  if (!input.value.trim()) return;
  const msg = input.value;
  messages.value.push({ role: 'user', content: msg });
  input.value = '';
  loading.value = true;
  try {
    const res = await chat({ prompt: msg });
    messages.value.push({ role: 'assistant', content: JSON.stringify(res) });
  } catch (error) {
    messages.value.push({ role: 'assistant', content: '对话接口调用失败' });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Page :title="$t('page.aiTutor.chat')">
    <NCard class="flex flex-col" style="min-height: 500px">
      <div
        class="flex-1 space-y-4 overflow-y-auto p-4"
        style="max-height: 400px"
      >
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="msg.role === 'user' ? 'text-right' : 'text-left'"
        >
          <span
            :class="
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            "
            class="inline-block rounded-lg px-4 py-2 text-sm"
          >
            {{ msg.content }}
          </span>
        </div>
        <div
          v-if="messages.length === 0"
          class="py-10 text-center text-gray-400"
        >
          开始与AI对话
        </div>
      </div>

      <NSpace class="mt-4">
        <NInput
          v-model:value="input"
          :loading="loading"
          :placeholder="$t('aiTutor.promptPlaceholder')"
          clearable
          style="width: 400px"
          @keyup.enter="sendMessage"
        />
        <NButton type="primary" :loading="loading" @click="sendMessage">
{{
          $t('aiTutor.send')
        }}
</NButton>
      </NSpace>
    </NCard>
  </Page>
</template>

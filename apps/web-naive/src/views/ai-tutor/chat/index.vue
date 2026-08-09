<script lang="ts" setup>
import { nextTick, onBeforeUnmount, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NButton, NCard, NEmpty, NInput, NSpace, useMessage } from 'naive-ui';

import { chatStream } from '#/api/agent/chat';
import { $t } from '#/locales';
import { renderSafeMarkdown } from '#/utils/markdown';

interface ChatMessage {
  content: string;
  id: number;
  role: 'assistant' | 'user';
  status?: 'error' | 'streaming';
}

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const loading = ref(false);
const messageId = ref(0);
const messageList = ref<HTMLElement>();
const notice = useMessage();
let controller: AbortController | undefined;

async function scrollToLatest() {
  await nextTick();
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
}

async function sendMessage(promptOverride?: string) {
  const prompt = (promptOverride ?? input.value).trim();
  if (!prompt || loading.value) return;

  messages.value.push({ content: prompt, id: ++messageId.value, role: 'user' });
  const assistant: ChatMessage = {
    content: '',
    id: ++messageId.value,
    role: 'assistant',
    status: 'streaming',
  };
  messages.value.push(assistant);
  input.value = '';
  loading.value = true;
  controller = new AbortController();
  await scrollToLatest();

  try {
    await chatStream(
      { prompt },
      (chunk) => {
        assistant.content += chunk;
        void scrollToLatest();
      },
      { signal: controller.signal },
    );
    if (!assistant.content) assistant.content = $t('ai-tutor.emptyResponse');
    assistant.status = undefined;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      assistant.content ||= $t('ai-tutor.stopped');
      assistant.status = undefined;
    } else {
      assistant.content ||= $t('ai-tutor.chatError');
      assistant.status = 'error';
    }
  } finally {
    loading.value = false;
    controller = undefined;
    await scrollToLatest();
  }
}

function stopGeneration() {
  controller?.abort();
}

function retryMessage(index: number) {
  const previous = [...messages.value.slice(0, index)]
    .reverse()
    .find((item) => item.role === 'user');
  if (!previous) return;
  messages.value.splice(index, 1);
  void sendMessage(previous.content);
}

async function copyMessage(content: string) {
  await navigator.clipboard.writeText(content);
  notice.success($t('ai-tutor.copied'));
}

onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <Page :title="$t('page.aiTutor.chat')" auto-content-height>
    <NCard class="chat-shell" content-class="chat-card-content">
      <div
        ref="messageList"
        class="message-list"
        role="log"
        aria-live="polite"
        :aria-label="$t('ai-tutor.messageList')"
      >
        <NEmpty
          v-if="messages.length === 0"
          class="py-16"
          :description="$t('ai-tutor.startChat')"
        />

        <article
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-row"
          :class="msg.role"
        >
          <div class="message-column">
            <div
              class="message-bubble"
              :class="{ 'message-error': msg.status === 'error' }"
            >
              <span v-if="msg.status === 'streaming' && !msg.content">
                {{ $t('ai-tutor.thinking') }}
              </span>
              <div
                v-else-if="msg.role === 'assistant'"
                class="chat-markdown"
                v-html="renderSafeMarkdown(msg.content)"
              ></div>
              <span v-else class="whitespace-pre-wrap">{{ msg.content }}</span>
            </div>

            <NSpace v-if="msg.role === 'assistant' && msg.content" size="small">
              <NButton text size="tiny" @click="copyMessage(msg.content)">
                {{ $t('ai-tutor.copy') }}
              </NButton>
              <NButton
                v-if="msg.status === 'error'"
                text
                size="tiny"
                @click="retryMessage(index)"
              >
                {{ $t('ai-tutor.retry') }}
              </NButton>
            </NSpace>
          </div>
        </article>
      </div>

      <form class="composer" @submit.prevent="sendMessage()">
        <NInput
          v-model:value="input"
          type="textarea"
          :autosize="{ minRows: 1, maxRows: 6 }"
          :disabled="loading"
          :placeholder="$t('ai-tutor.promptPlaceholder')"
          @keydown.enter.exact.prevent="sendMessage()"
        />
        <NButton v-if="loading" type="warning" @click="stopGeneration">
          {{ $t('ai-tutor.stop') }}
        </NButton>
        <NButton
          v-else
          attr-type="submit"
          type="primary"
          :disabled="!input.trim()"
        >
          {{ $t('ai-tutor.send') }}
        </NButton>
      </form>
      <p class="mt-2 text-xs text-muted-foreground">
        {{ $t('ai-tutor.inputHint') }}
      </p>
    </NCard>
  </Page>
</template>

<style scoped>
.chat-shell {
  height: 100%;
  min-height: 32rem;
}

.chat-shell :deep(.chat-card-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.message-list {
  flex: 1;
  min-height: 20rem;
  padding: 1rem;
  overflow-y: auto;
}

.message-row {
  display: flex;
  margin-bottom: 1rem;
}

.message-row.user {
  justify-content: flex-end;
}

.message-column {
  max-width: min(48rem, 88%);
}

.message-bubble {
  padding: 0.65rem 0.9rem;
  color: hsl(var(--foreground));
  overflow-wrap: anywhere;
  background: hsl(var(--muted));
  border-radius: 0.75rem;
}

.user .message-bubble {
  color: hsl(var(--primary-foreground));
  background: hsl(var(--primary));
}

.message-error {
  border: 1px solid hsl(var(--destructive));
}

.composer {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  padding-top: 1rem;
  border-top: 1px solid hsl(var(--border));
}

.chat-markdown :deep(pre) {
  max-width: 100%;
  padding: 0.75rem;
  margin: 0.5rem 0;
  overflow-x: auto;
  background: hsl(var(--background));
  border-radius: 0.5rem;
}

.chat-markdown :deep(code) {
  font-family: var(--font-family-mono, monospace);
}

@media (max-width: 639px) {
  .message-list {
    padding: 0.5rem 0;
  }

  .message-column {
    max-width: 94%;
  }

  .composer {
    flex-wrap: wrap;
  }

  .composer :deep(.n-button) {
    width: 100%;
  }
}
</style>

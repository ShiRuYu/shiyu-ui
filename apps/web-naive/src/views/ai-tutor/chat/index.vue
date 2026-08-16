<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NEmpty, NList, NListItem, NDrawer, NDrawerContent,
  NInput,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { cancelGeneration, chatStream, createConversation, editMessage, getConversationMessages, getModelOptions, getPromptPreview, listBranches, listConversations, retryGeneration, streamGeneration } from '#/api/agent/chat';
import { getPlatformOptions } from '#/api/agent/platform';
import { cancelRuntimeRun, getRuntimeRunEvents, listRuntimeApps, streamGenerationRuntimeEvents, type AiAppSummary, type AiRunEvent, type RuntimeMode } from '#/api/runtime';
import { $t } from '#/locales';
import { renderSafeMarkdown } from '#/utils/markdown';

interface ChatMessage {
  content: string;
  id: string;
  role: 'assistant' | 'user';
  status?: 'error' | 'streaming';
}

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const loading = ref(false);
const messageId = ref(0);
const conversations = ref<Array<{ id: string; title?: string }>>([]);
const branches = ref<Array<{ id: string; title?: string }>>([]);
const editingMessageId = ref<string>();
const editingText = ref('');
const activeConversationId = ref<string>();
const promptPreview = ref<{
  messages: Array<{ role: string; contentParts?: Array<{ text?: string }> }>;
  sources?: Array<{ source: string; content: string; estimatedTokens: number }>;
  estimatedTokens: number;
  truncated: boolean;
  truncationReason?: string;
  modelParameters?: Record<string, unknown>;
}>();
const previewVisible = ref(false);
const traceVisible = ref(false);
const runtimeEvents = ref<AiRunEvent[]>([]);
const messageList = ref<HTMLElement>();
const platformOptions = ref<
  Array<{ code: string; label: string; value: number }>
>([]);
const modelOptions = ref<Array<{ label: string; value: string }>>([]);
const selectedPlatformId = ref<number>();
const selectedModel = ref<string>();
const mode = ref<RuntimeMode>('chat');
const runtimeApps = ref<AiAppSummary[]>([]);
const selectedAppId = ref<string>();
const loadingPlatforms = ref(false);
const loadingModels = ref(false);
const catalogError = ref(false);
const notice = useMessage();
let controller: AbortController | undefined;
let activeRunId: string | undefined;

async function loadModels(platformId: number) {
  loadingModels.value = true;
  selectedModel.value = undefined;
  modelOptions.value = [];
  try {
    const models = await getModelOptions(platformId);
    modelOptions.value = (models ?? [])
      .filter((item) => item.value)
      .map((item) => ({
        label: item.name || item.value || '',
        value: item.value || '',
      }));
    selectedModel.value = modelOptions.value[0]?.value;
  } catch {
    catalogError.value = true;
  } finally {
    loadingModels.value = false;
  }
}

async function loadPlatforms() {
  loadingPlatforms.value = true;
  catalogError.value = false;
  try {
    const platforms = await getPlatformOptions();
    platformOptions.value = (platforms ?? []).map((item) => ({
      code: item.code,
      label: item.name,
      value: item.id,
    }));
    selectedPlatformId.value = platformOptions.value[0]?.value;
    if (selectedPlatformId.value) {
      await loadModels(selectedPlatformId.value);
    }
  } catch {
    catalogError.value = true;
  } finally {
    loadingPlatforms.value = false;
  }
}

async function onPlatformChange(platformId: number) {
  catalogError.value = false;
  await loadModels(platformId);
}

async function scrollToLatest() {
  await nextTick();
  if (messageList.value) {
    messageList.value.scrollTop = messageList.value.scrollHeight;
  }
}

async function sendMessage(promptOverride?: string) {
  const prompt = (promptOverride ?? input.value).trim();
  if (!prompt || loading.value) return;

  const platform = platformOptions.value.find(
    (item) => item.value === selectedPlatformId.value,
  )?.code;
  if (!platform || !selectedModel.value) {
    notice.warning($t('ai-tutor.selectionRequired'));
    return;
  }

  if (!activeConversationId.value) {
    const created = await createConversation({ platform, model: selectedModel.value, title: prompt.slice(0, 40), sceneType: mode.value });
    activeConversationId.value = created.id;
    conversations.value = [{ id: created.id, title: created.title }, ...conversations.value];
  }
  messages.value.push({ content: prompt, id: String(++messageId.value), role: 'user' });
  const assistant: ChatMessage = {
    content: '',
    id: String(++messageId.value),
    role: 'assistant',
    status: 'streaming',
  };
  messages.value.push(assistant);
  input.value = '';
  loading.value = true;
  controller = new AbortController();
  await scrollToLatest();

  try {
    const generationId = await chatStream(
      { model: selectedModel.value, platform, prompt, conversationId: activeConversationId.value, sceneType: mode.value, appId: selectedAppId.value },
      (chunk) => {
        assistant.content += chunk;
        void scrollToLatest();
      },
      { signal: controller.signal, onRunId: (runId) => { activeRunId = runId; } },
    );
    try {
      runtimeEvents.value = [];
      if (mode.value === 'agent') {
        runtimeEvents.value = (await getRuntimeRunEvents(generationId)) ?? [];
      } else {
        await streamGenerationRuntimeEvents(generationId, (event) => {
          runtimeEvents.value.push(event);
        });
      }
    } catch {
      // Runtime tracing is observational and must not turn a completed chat into an error.
    }
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
    activeRunId = undefined;
    await scrollToLatest();
  }
}

async function loadConversation(id: string) {
  if (loading.value) return;
  activeConversationId.value = id;
  branches.value = await listBranches(id).catch(() => []);
  const remote = await getConversationMessages(id);
  messages.value = (remote ?? []).filter((item) => item.role === 'USER' || item.role === 'ASSISTANT').map((item) => ({
    id: item.id, role: item.role.toLowerCase() as 'user' | 'assistant', content: (item.contentParts ?? []).map((part) => part.text ?? '').join(''),
  }));
  await scrollToLatest();
}

function beginEdit(message: ChatMessage) {
  editingMessageId.value = message.id;
  editingText.value = message.content;
}

async function saveEdit() {
  if (!editingMessageId.value || !editingText.value.trim()) return;
  await editMessage(editingMessageId.value, editingText.value.trim());
  editingMessageId.value = undefined;
  if (activeConversationId.value) await loadConversation(activeConversationId.value);
}

function newConversation() {
  if (loading.value) return;
  activeConversationId.value = undefined;
  messages.value = [];
}

async function loadConversationList() {
  try { conversations.value = (await listConversations()) ?? []; } catch { catalogError.value = true; }
}

async function loadRuntimeApps() {
  try {
    runtimeApps.value = (await listRuntimeApps()) ?? [];
    selectedAppId.value = runtimeApps.value[0]?.id;
  } catch {
    // App selection is optional for the chat mode; keep the workspace usable.
    runtimeApps.value = [];
  }
}

async function showPromptPreview() {
  if (!activeConversationId.value) return;
  promptPreview.value = await getPromptPreview(activeConversationId.value);
  previewVisible.value = true;
}

async function stopGeneration() {
  const runId = activeRunId;
  if (runId) {
    try {
      if (mode.value === 'agent') await cancelRuntimeRun(runId);
      else await cancelGeneration(runId);
    } catch { /* the local abort still releases the UI */ }
  }
  controller?.abort();
}

async function retryMessage(index: number) {
  const previous = [...messages.value.slice(0, index)]
    .toReversed()
    .find((item) => item.role === 'user');
  if (!previous) return;
  if (!activeConversationId.value || previous.id.length < 10) {
    messages.value.splice(index, 1);
    await sendMessage(previous.content);
    return;
  }
  const platform = platformOptions.value.find((item) => item.value === selectedPlatformId.value)?.code;
  if (!platform || !selectedModel.value || loading.value) return;
  messages.value.splice(index, 1);
  const assistant: ChatMessage = { content: '', id: `retry-${Date.now()}`, role: 'assistant', status: 'streaming' };
  messages.value.push(assistant);
  loading.value = true;
  controller = new AbortController();
  try {
    const run = await retryGeneration(previous.id, { platform, model: selectedModel.value });
    activeRunId = run.id;
    await streamGeneration(run.id, (chunk) => { assistant.content += chunk; void scrollToLatest(); }, controller.signal);
    assistant.status = undefined;
  } catch (error) {
    assistant.status = 'error';
    assistant.content ||= error instanceof DOMException && error.name === 'AbortError' ? $t('ai-tutor.stopped') : $t('ai-tutor.chatError');
  } finally {
    loading.value = false;
    controller = undefined;
    activeRunId = undefined;
    await loadConversation(activeConversationId.value);
  }
}

async function copyMessage(content: string) {
  await navigator.clipboard.writeText(content);
  notice.success($t('ai-tutor.copied'));
}

onBeforeUnmount(() => controller?.abort());
onMounted(async () => { await Promise.all([loadPlatforms(), loadConversationList(), loadRuntimeApps()]); });
</script>

<template>
  <Page :title="$t('page.aiTutor.chat')" auto-content-height>
    <div class="workspace-shell">
      <NCard class="conversation-sidebar" content-class="sidebar-content">
        <div class="sidebar-title">Conversations</div>
        <NButton size="small" block @click="newConversation">New conversation</NButton>
        <NList v-if="conversations.length" clickable>
          <NListItem v-for="conversation in conversations" :key="conversation.id" @click="loadConversation(conversation.id)">
            <span class="truncate">{{ conversation.title || conversation.id }}</span>
          </NListItem>
        </NList>
        <template v-if="branches.length">
          <div class="sidebar-subtitle">Branches</div>
          <NList clickable>
            <NListItem v-for="branch in branches" :key="branch.id" @click="loadConversation(branch.id)">
              <span class="truncate">{{ branch.title || branch.id }}</span>
            </NListItem>
          </NList>
        </template>
        <NEmpty v-else size="small" description="No conversations" />
      </NCard>
      <NCard class="chat-shell" content-class="chat-card-content">
      <div class="model-toolbar">
        <NSelect
          v-model:value="mode"
          class="model-select"
          aria-label="Runtime mode"
          :options="[
            { label: 'Chat', value: 'chat' },
            { label: 'Agent', value: 'agent' },
            { label: 'RAG', value: 'rag' },
          ]"
        />
        <NSelect
          v-if="mode !== 'chat' && runtimeApps.length"
          v-model:value="selectedAppId"
          class="model-select"
          aria-label="AI App"
          :options="runtimeApps.map((app) => ({ label: app.name, value: app.id }))"
          placeholder="Select AI App"
        />
        <NSelect
          v-model:value="selectedPlatformId"
          class="model-select"
          :aria-label="$t('ai-tutor.platform')"
          :disabled="loading"
          :loading="loadingPlatforms"
          :options="platformOptions"
          :placeholder="$t('ai-tutor.selectPlatform')"
          @update:value="onPlatformChange"
        />
        <NSelect
          v-model:value="selectedModel"
          class="model-select"
          :aria-label="$t('ai-tutor.model')"
          :disabled="loading || !selectedPlatformId"
          :loading="loadingModels"
          :options="modelOptions"
          :placeholder="$t('ai-tutor.selectModel')"
        />
      </div>
      <NAlert v-if="catalogError" class="mb-3" type="error">
        {{ $t('ai-tutor.catalogError') }}
      </NAlert>
      <NAlert v-if="mode !== 'chat'" class="mb-3" type="info">
        {{ mode === 'agent' ? 'Agent mode uses the selected published App and records an AiRun trace.' : 'RAG mode keeps citations and MAGMA relations in the runtime context.' }}
      </NAlert>
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
              <template v-else>
                <NInput v-if="editingMessageId === msg.id" v-model:value="editingText" type="textarea" />
                <span v-else class="whitespace-pre-wrap">{{ msg.content }}</span>
              </template>
            </div>

            <NSpace v-if="msg.role === 'user' || (msg.role === 'assistant' && msg.content)" size="small">
              <NButton v-if="msg.role === 'user' && editingMessageId !== msg.id" text size="tiny" @click="beginEdit(msg)">Edit</NButton>
              <NButton v-if="msg.role === 'user' && editingMessageId === msg.id" text size="tiny" @click="saveEdit">Save</NButton>
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

      <div class="workspace-actions">
        <NButton size="small" secondary :disabled="!activeConversationId" @click="showPromptPreview">Prompt preview</NButton>
        <NButton size="small" secondary :disabled="runtimeEvents.length === 0" @click="traceVisible = true">Run trace</NButton>
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
          :disabled="
            !input.trim() ||
            !selectedPlatformId ||
            !selectedModel ||
            loadingPlatforms ||
            loadingModels
          "
        >
          {{ $t('ai-tutor.send') }}
        </NButton>
      </form>
      <p class="mt-2 text-xs text-muted-foreground">
        {{ $t('ai-tutor.inputHint') }}
      </p>
      </NCard>
      <NDrawer v-model:show="previewVisible" placement="right" :width="360">
        <NDrawerContent title="Prompt preview">
          <p>Estimated tokens: {{ promptPreview?.estimatedTokens ?? 0 }}</p>
          <p v-if="promptPreview?.truncated">Prompt was truncated to model limits.</p>
          <p v-if="promptPreview?.truncationReason">{{ promptPreview.truncationReason }}</p>
          <div v-for="(segment, index) in promptPreview?.sources ?? []" :key="`${segment.source}-${index}`" class="preview-segment">
            <strong>{{ segment.source }}</strong>
            <span>{{ segment.estimatedTokens }} tokens</span>
            <pre>{{ segment.content }}</pre>
          </div>
        </NDrawerContent>
      </NDrawer>
      <NDrawer v-model:show="traceVisible" placement="right" :width="360">
        <NDrawerContent title="Run trace">
          <NList v-if="runtimeEvents.length" bordered>
            <NListItem v-for="event in runtimeEvents" :key="`${event.runId}-${event.seq}`">
              <div class="trace-event">
                <strong>{{ event.seq }} · {{ event.type }}</strong>
                <span v-if="event.createdAt">{{ event.createdAt }}</span>
                <pre v-if="event.payload">{{ event.payload }}</pre>
              </div>
            </NListItem>
          </NList>
          <NEmpty v-else description="No runtime events" />
        </NDrawerContent>
      </NDrawer>
    </div>
  </Page>
</template>

<style scoped>
.workspace-shell {
  display: flex;
  gap: 1rem;
  height: 100%;
  min-height: 32rem;
}

.conversation-sidebar {
  width: 15rem;
  flex: 0 0 15rem;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-title { font-weight: 600; }

.chat-shell {
  flex: 1;
  height: 100%;
  min-height: 32rem;
}

.chat-shell :deep(.chat-card-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.model-toolbar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 18rem));
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid hsl(var(--border));
}

.model-select {
  width: 100%;
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

.workspace-actions { display: flex; justify-content: flex-end; padding-top: 0.75rem; }

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
  .workspace-shell { display: block; }
  .conversation-sidebar { width: 100%; margin-bottom: 0.75rem; }
  .model-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

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

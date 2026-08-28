<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  NAlert,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NInput,
  NList,
  NListItem,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import {
  createConversation,
  editMessage,
  getConversationMessages,
  getModelOptions,
  getPromptPreview,
  listBranches,
  listConversations,
  useGenerationStream,
} from '#/features/conversation';
import { getPlatformOptions } from '#/features/model';
import { listRuntimeApps } from '#/features/agent';
import type { AiAppSummary, AiRunEvent, RuntimeMode } from '#/features/agent';
import { $t } from '#/locales';
import { renderSafeMarkdown } from '#/utils/markdown';

interface ChatMessage {
  content: string;
  id: string;
  role: 'assistant' | 'system' | 'tool' | 'user';
  reasoning?: string;
  status?: 'error' | 'streaming';
}

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const messageId = ref(0);
const conversations = ref<Array<{ id: string; title?: string }>>([]);
const branches = ref<Array<{ id: string; title?: string }>>([]);
const editingMessageId = ref<string>();
const editingText = ref('');
const activeConversationId = ref<string>();
const promptPreview = ref<{
  estimatedTokens: number;
  messages: Array<{ contentParts?: Array<{ text?: string }>; role: string }>;
  modelParameters?: Record<string, unknown>;
  sources?: Array<{ content: string; estimatedTokens: number; source: string }>;
  truncated: boolean;
  truncationReason?: string;
}>();
const previewVisible = ref(false);
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
const contextTab = ref<'context' | 'details' | 'trace'>('context');
const sidebarVisible = ref(false);
const mobileContextVisible = ref(false);
const notice = useMessage();
const {
  dispose: disposeGenerationStream,
  loading,
  retry: retryGenerationStream,
  start: startGenerationStream,
  stop: stopGenerationStream,
} = useGenerationStream();

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
    const created = await createConversation({
      platform,
      model: selectedModel.value,
      title: prompt.slice(0, 40),
      sceneType: mode.value,
    });
    activeConversationId.value = created.id;
    conversations.value = [
      { id: created.id, title: created.title },
      ...conversations.value,
    ];
  }
  messages.value.push({
    content: prompt,
    id: String(++messageId.value),
    role: 'user',
  });
  const assistant: ChatMessage = {
    content: '',
    id: String(++messageId.value),
    role: 'assistant',
    status: 'streaming',
  };
  messages.value.push(assistant);
  input.value = '';
  await scrollToLatest();

  try {
    await startGenerationStream(
      {
        model: selectedModel.value,
        platform,
        prompt,
        conversationId: activeConversationId.value,
        sceneType: mode.value,
        appId: selectedAppId.value,
      },
      mode.value,
      {
        onChunk: (chunk) => {
          assistant.content += chunk;
          void scrollToLatest();
        },
        onReasoning: (delta) => {
          assistant.reasoning = `${assistant.reasoning ?? ''}${delta}`;
        },
        onRuntimeEvent: (event) => {
          runtimeEvents.value.push(event);
        },
        onRuntimeEvents: (events) => {
          runtimeEvents.value = events;
        },
        onRuntimeReset: () => {
          runtimeEvents.value = [];
        },
      },
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
    await scrollToLatest();
  }
}

async function loadConversation(id: string) {
  if (loading.value) return;
  activeConversationId.value = id;
  branches.value = await listBranches(id).catch(() => []);
  const remote = await getConversationMessages(id);
  messages.value = (remote ?? []).map((item) => ({
    id: item.id,
    role: item.role.toLowerCase() as ChatMessage['role'],
    content: (item.contentParts ?? []).map((part) => part.text ?? '').join(''),
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
  if (activeConversationId.value)
    await loadConversation(activeConversationId.value);
}

function newConversation() {
  if (loading.value) return;
  activeConversationId.value = undefined;
  messages.value = [];
}

async function loadConversationList() {
  try {
    conversations.value = (await listConversations()) ?? [];
  } catch {
    catalogError.value = true;
  }
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
  await stopGenerationStream(mode.value);
}

function openMobileContext(tab: 'context' | 'details' | 'trace') {
  contextTab.value = tab;
  mobileContextVisible.value = true;
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
  const platform = platformOptions.value.find(
    (item) => item.value === selectedPlatformId.value,
  )?.code;
  if (!platform || !selectedModel.value || loading.value) return;
  messages.value.splice(index, 1);
  const assistant: ChatMessage = {
    content: '',
    id: `retry-${Date.now()}`,
    role: 'assistant',
    status: 'streaming',
  };
  messages.value.push(assistant);
  try {
    await retryGenerationStream(
      previous.id,
      { platform, model: selectedModel.value },
      {
        onChunk: (chunk) => {
          assistant.content += chunk;
          void scrollToLatest();
        },
      },
    );
    assistant.status = undefined;
  } catch (error) {
    assistant.status = 'error';
    assistant.content ||=
      error instanceof DOMException && error.name === 'AbortError'
        ? $t('ai-tutor.stopped')
        : $t('ai-tutor.chatError');
  } finally {
    await loadConversation(activeConversationId.value);
  }
}

async function copyMessage(content: string) {
  await navigator.clipboard.writeText(content);
  notice.success($t('ai-tutor.copied'));
}

onBeforeUnmount(disposeGenerationStream);
onMounted(async () => {
  await Promise.all([
    loadPlatforms(),
    loadConversationList(),
    loadRuntimeApps(),
  ]);
});
</script>

<template>
  <Page :title="$t('page.aiTutor.chat')" auto-content-height>
    <div class="workspace-shell">
      <NCard class="conversation-sidebar" content-class="sidebar-content">
        <div class="sidebar-title">会话与分支</div>
        <NButton size="small" block @click="newConversation">
          新建会话
        </NButton>
        <NList v-if="conversations.length" clickable>
          <NListItem
            v-for="conversation in conversations"
            :key="conversation.id"
            @click="loadConversation(conversation.id)"
          >
            <span class="truncate">{{
              conversation.title || conversation.id
            }}</span>
          </NListItem>
        </NList>
        <template v-if="branches.length">
          <div class="sidebar-subtitle">当前分支</div>
          <NList clickable>
            <NListItem
              v-for="branch in branches"
              :key="branch.id"
              @click="loadConversation(branch.id)"
            >
              <span class="truncate">{{ branch.title || branch.id }}</span>
            </NListItem>
          </NList>
        </template>
        <NEmpty v-else size="small" description="暂无会话" />
      </NCard>
      <NCard class="chat-shell" content-class="chat-card-content">
        <div class="workspace-topbar">
          <NButton
            class="mobile-session-button"
            secondary
            size="small"
            @click="sidebarVisible = true"
          >
            会话
          </NButton>
          <div class="workspace-heading">
            <span class="eyebrow">AI 工作区</span>
            <strong>{{ activeConversationId ? '当前会话' : '新会话' }}</strong>
          </div>
          <div class="model-toolbar">
            <NSelect
              v-model:value="mode"
              class="model-select"
              aria-label="工作区模式"
              :options="[
                { label: 'Chat 对话', value: 'chat' },
                { label: 'Agent 执行', value: 'agent' },
                { label: 'RAG 检索', value: 'rag' },
              ]"
            />
            <NSelect
              v-if="mode !== 'chat' && runtimeApps.length"
              v-model:value="selectedAppId"
              class="model-select"
              aria-label="AI 应用"
              :options="
                runtimeApps.map((app) => ({ label: app.name, value: app.id }))
              "
              placeholder="选择已发布应用"
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
          <div class="topbar-actions">
            <NButton
              size="small"
              secondary
              :disabled="!activeConversationId"
              @click="showPromptPreview"
            >
              Prompt 预览
            </NButton>
            <NButton
              size="small"
              secondary
              :disabled="runtimeEvents.length === 0"
              @click="openMobileContext('trace')"
            >
              运行轨迹
            </NButton>
            <NButton
              class="mobile-context-button"
              size="small"
              secondary
              @click="openMobileContext('context')"
            >
              上下文
            </NButton>
          </div>
        </div>
        <NAlert v-if="catalogError" class="mb-3" type="error">
          {{ $t('ai-tutor.catalogError') }}
        </NAlert>
        <NAlert v-if="mode !== 'chat'" class="mb-3" type="info">
          {{
            mode === 'agent'
              ? 'Agent 模式使用已发布应用，并记录完整运行轨迹。'
              : 'RAG 模式保留知识引用与 MAGMA 关系路径，便于核验上下文。'
          }}
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
                <details
                  v-if="msg.role === 'assistant' && msg.reasoning"
                  class="reasoning-block"
                >
                  <summary>思考过程</summary>
                  <p>{{ msg.reasoning }}</p>
                </details>
                <div v-if="msg.role === 'system'" class="system-message">
                  <span class="message-label">SYSTEM</span>
                  <span class="whitespace-pre-wrap">{{ msg.content }}</span>
                </div>
                <div v-else-if="msg.role === 'tool'" class="tool-message">
                  <span class="message-label">TOOL</span>
                  <span class="whitespace-pre-wrap">{{ msg.content }}</span>
                </div>
                <div
                  v-else-if="msg.role === 'assistant'"
                  class="chat-markdown"
                  v-html="renderSafeMarkdown(msg.content)"
                ></div>
                <template v-else>
                  <NInput
                    v-if="editingMessageId === msg.id"
                    v-model:value="editingText"
                    type="textarea"
                  />
                  <span v-else class="whitespace-pre-wrap">{{
                    msg.content
                  }}</span>
                </template>
              </div>

              <NSpace
                v-if="
                  msg.role === 'user' ||
                  (msg.role === 'assistant' && msg.content)
                "
                size="small"
              >
                <NButton
                  v-if="msg.role === 'user' && editingMessageId !== msg.id"
                  text
                  size="tiny"
                  @click="beginEdit(msg)"
                >
                  编辑
                </NButton>
                <NButton
                  v-if="msg.role === 'user' && editingMessageId === msg.id"
                  text
                  size="tiny"
                  @click="saveEdit"
                >
                  保存
                </NButton>
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
      <aside
        class="context-panel"
        :class="{ 'mobile-visible': mobileContextVisible }"
      >
        <div class="context-tabs" role="tablist" aria-label="运行详情">
          <button
            :class="{ active: contextTab === 'context' }"
            type="button"
            @click="contextTab = 'context'"
          >
            上下文
          </button>
          <button
            :class="{ active: contextTab === 'trace' }"
            type="button"
            @click="contextTab = 'trace'"
          >
            轨迹
          </button>
          <button
            :class="{ active: contextTab === 'details' }"
            type="button"
            @click="contextTab = 'details'"
          >
            详情
          </button>
          <button
            class="context-close"
            type="button"
            aria-label="关闭上下文面板"
            @click="mobileContextVisible = false"
          >
            关闭
          </button>
        </div>
        <div v-if="contextTab === 'context'" class="context-content">
          <div class="context-title">Prompt 预览</div>
          <div class="metric-row">
            <span>预计 Token</span
            ><strong>{{ promptPreview?.estimatedTokens ?? 0 }}</strong>
          </div>
          <NButton
            block
            secondary
            size="small"
            :disabled="!activeConversationId"
            @click="showPromptPreview"
          >
            刷新上下文
          </NButton>
          <NEmpty
            v-if="!promptPreview"
            size="small"
            description="发送消息后查看结构化上下文"
          />
          <div v-else class="context-segments">
            <div
              v-for="(segment, index) in promptPreview.sources ?? []"
              :key="`${segment.source}-${index}`"
              class="context-segment"
            >
              <div class="segment-head">
                <strong>{{ segment.source }}</strong
                ><span>{{ segment.estimatedTokens }} tokens</span>
              </div>
              <p>{{ segment.content }}</p>
            </div>
          </div>
          <NAlert
            v-if="promptPreview?.truncated"
            type="warning"
            :bordered="false"
          >
            上下文已截断：{{
              promptPreview.truncationReason || '达到模型上下文限制'
            }}
          </NAlert>
        </div>
        <div v-else-if="contextTab === 'trace'" class="context-content">
          <div class="context-title">运行轨迹</div>
          <NEmpty
            v-if="!runtimeEvents.length"
            size="small"
            description="暂无运行事件"
          />
          <NList v-else class="trace-list" bordered>
            <NListItem
              v-for="event in runtimeEvents"
              :key="`${event.runId}-${event.seq}`"
            >
              <div class="trace-event">
                <strong>{{ event.seq }} · {{ event.type }}</strong
                ><span v-if="event.createdAt">{{ event.createdAt }}</span>
              </div>
            </NListItem>
          </NList>
        </div>
        <div v-else class="context-content">
          <div class="context-title">会话详情</div>
          <div class="detail-item">
            <span>模式</span
            ><strong>{{
              mode === 'chat' ? '对话' : mode === 'agent' ? 'Agent' : 'RAG'
            }}</strong>
          </div>
          <div class="detail-item">
            <span>模型</span><strong>{{ selectedModel || '未选择' }}</strong>
          </div>
          <div class="detail-item">
            <span>运行状态</span
            ><strong>{{ loading ? '生成中' : '就绪' }}</strong>
          </div>
          <div class="detail-item">
            <span>消息数</span><strong>{{ messages.length }}</strong>
          </div>
        </div>
      </aside>
      <NDrawer v-model:show="sidebarVisible" placement="left" :width="300">
        <NDrawerContent title="会话与分支">
          <NButton block @click="newConversation">新建会话</NButton>
          <NList v-if="conversations.length" clickable>
            <NListItem
              v-for="conversation in conversations"
              :key="conversation.id"
              @click="
                loadConversation(conversation.id);
                sidebarVisible = false;
              "
            >
              {{ conversation.title || conversation.id }}
            </NListItem>
          </NList>
          <NEmpty v-else size="small" description="暂无会话" />
        </NDrawerContent>
      </NDrawer>
      <NDrawer v-model:show="previewVisible" placement="right" :width="360">
        <NDrawerContent title="Prompt 预览">
          <p>预计 Token：{{ promptPreview?.estimatedTokens ?? 0 }}</p>
          <p v-if="promptPreview?.truncated">Prompt 已按模型上下文限制截断。</p>
          <p v-if="promptPreview?.truncationReason">
            {{ promptPreview.truncationReason }}
          </p>
          <div
            v-for="(segment, index) in promptPreview?.sources ?? []"
            :key="`${segment.source}-${index}`"
            class="preview-segment"
          >
            <strong>{{ segment.source }}</strong>
            <span>{{ segment.estimatedTokens }} tokens</span>
            <pre>{{ segment.content }}</pre>
          </div>
        </NDrawerContent>
      </NDrawer>
    </div>
  </Page>
</template>

<style scoped>
.workspace-shell {
  display: grid;
  grid-template-columns: 15rem minmax(34rem, 1fr) 22.5rem;
  gap: 0;
  height: 100%;
  min-height: calc(100vh - 7rem);
  overflow: hidden;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.75rem;
}

.conversation-sidebar {
  width: auto;
  border: 0;
  border-right: 1px solid hsl(var(--border));
  border-radius: 0;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-title {
  font-weight: 600;
}

.chat-shell {
  min-width: 0;
  height: 100%;
  min-height: 32rem;
  border: 0;
  border-radius: 0;
}

.chat-shell :deep(.chat-card-content) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.workspace-topbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid hsl(var(--border));
}

.workspace-heading {
  display: flex;
  flex-direction: column;
  min-width: 6rem;
  margin-right: auto;
}

.eyebrow {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.model-toolbar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-width: min(100%, 32rem);
}

.model-select {
  width: 8rem;
}

.topbar-actions {
  display: flex;
  gap: 0.5rem;
}

.mobile-context-button {
  display: none;
}

.mobile-session-button {
  display: none;
}

.message-list {
  flex: 1;
  min-height: 20rem;
  padding: 1.25rem clamp(0.75rem, 4vw, 3rem);
  overflow-y: auto;
}

.message-row {
  display: flex;
  margin-bottom: 1rem;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.system,
.message-row.tool {
  justify-content: center;
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

.system .message-bubble,
.tool .message-bubble {
  width: min(100%, 48rem);
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  background: color-mix(in srgb, hsl(var(--muted)) 60%, transparent);
  border: 1px dashed hsl(var(--border));
}

.tool .message-bubble {
  color: hsl(var(--foreground));
  background: color-mix(in srgb, hsl(var(--primary)) 8%, transparent);
  border-style: solid;
}

.system-message,
.tool-message {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.message-label {
  font-size: 0.65rem;
  font-weight: 700;
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.08em;
}

.reasoning-block {
  margin-bottom: 0.65rem;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
}

.reasoning-block summary {
  font-weight: 600;
  cursor: pointer;
}

.reasoning-block p {
  max-height: 8rem;
  margin: 0.45rem 0 0;
  overflow: auto;
  white-space: pre-wrap;
}

.composer {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid hsl(var(--border));
}

.composer :deep(.n-input) {
  flex: 1;
}

.workspace-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 0.75rem;
}

.context-panel {
  min-width: 0;
  overflow-y: auto;
  background: color-mix(in srgb, hsl(var(--muted)) 24%, transparent);
  border-left: 1px solid hsl(var(--border));
}

.context-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-bottom: 1px solid hsl(var(--border));
}

.context-tabs button {
  padding: 0.8rem 0.25rem;
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
}

.context-tabs button.active {
  font-weight: 600;
  color: hsl(var(--primary));
  box-shadow: inset 0 -2px hsl(var(--primary));
}

.context-close {
  display: none;
}

.context-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
}

.context-title {
  font-weight: 600;
}

.metric-row,
.detail-item,
.segment-head {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  justify-content: space-between;
}

.metric-row,
.detail-item {
  padding: 0.6rem 0;
  font-size: 0.8rem;
  border-bottom: 1px solid hsl(var(--border));
}

.context-segments {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.context-segment {
  padding: 0.65rem;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
}

.context-segment p {
  max-height: 7rem;
  margin: 0.45rem 0 0;
  overflow: auto;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  white-space: pre-wrap;
}

.segment-head span,
.trace-event span {
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
}

.trace-list {
  max-height: calc(100vh - 12rem);
  overflow: auto;
}

.trace-event {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  .workspace-shell {
    display: block;
    min-height: calc(100vh - 5rem);
    border: 0;
    border-radius: 0;
  }

  .conversation-sidebar {
    display: none;
  }

  .chat-shell {
    min-height: calc(100vh - 5rem);
  }

  .context-panel {
    display: none;
  }

  .context-panel.mobile-visible {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 30;
    display: block;
    max-height: 58vh;
    overflow-y: auto;
    background: hsl(var(--background));
    border: 1px solid hsl(var(--border));
    border-radius: 0.75rem 0.75rem 0 0;
    box-shadow: 0 -0.5rem 2rem rgb(0 0 0 / 18%);
  }

  .context-panel.mobile-visible .context-tabs {
    grid-template-columns: repeat(4, 1fr);
  }

  .context-close {
    display: block;
    color: hsl(var(--muted-foreground));
  }

  .mobile-session-button {
    display: inline-flex;
  }

  .mobile-context-button {
    display: inline-flex;
  }

  .model-toolbar {
    flex: 1;
    min-width: 0;
    overflow-x: auto;
  }

  .model-select {
    min-width: 8rem;
  }

  .topbar-actions {
    width: 100%;
  }

  .topbar-actions :deep(.n-button) {
    flex: 1;
  }

  .message-list {
    padding: 0.5rem 0;
  }

  .message-column {
    max-width: 94%;
  }

  .composer {
    position: sticky;
    bottom: 0;
    flex-wrap: wrap;
    padding: 0.75rem 0 max(0.75rem, env(safe-area-inset-bottom));
    background: hsl(var(--background));
  }

  .composer :deep(.n-button) {
    width: 100%;
  }
}
</style>

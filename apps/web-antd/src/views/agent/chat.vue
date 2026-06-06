<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { message } from 'ant-design-vue';

import type { AgentDefinition } from '#/api/agent';

import {
  executeAgentApi,
  executeAgentStreamApi,
  getAgentDetailApi,
} from '#/api/agent';

const route = useRoute();
const router = useRouter();

const agentId = route.params.agentId as string;

// Agent 信息
const agentInfo = ref<AgentDefinition | null>(null);
const loading = ref(false);

// 对话状态
interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  loading?: boolean;
}

const messages = ref<ChatMessage[]>([]);
const inputText = ref('');
const sending = ref(false);
const streamMode = ref(true);
const chatContainer = ref<HTMLElement | null>(null);
let abortController: AbortController | null = null;
let messageIdCounter = 0;

// 加载 Agent 信息
async function fetchAgentDetail() {
  loading.value = true;
  try {
    const res = await getAgentDetailApi(agentId);
    agentInfo.value = res as any;
  } catch (e: any) {
    message.error(e?.message || '获取 Agent 信息失败');
  } finally {
    loading.value = false;
  }
}

// 发送消息
async function handleSend() {
  const text = inputText.value.trim();
  if (!text || sending.value) return;

  // 添加用户消息
  const userMsg: ChatMessage = {
    id: ++messageIdCounter,
    role: 'user',
    content: text,
  };
  messages.value.push(userMsg);
  inputText.value = '';

  // 添加 AI 占位消息
  const aiMsg: ChatMessage = {
    id: ++messageIdCounter,
    role: 'assistant',
    content: '',
    loading: true,
  };
  messages.value.push(aiMsg);
  sending.value = true;
  await scrollToBottom();

  const input = { query: text };

  try {
    if (streamMode.value) {
      // 流式调用
      abortController = executeAgentStreamApi(
        agentId,
        input,
        (data) => {
          // 解析 SSE 数据
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.data?.content || parsed?.content || data;
            aiMsg.content += content;
          } catch {
            aiMsg.content += data;
          }
          aiMsg.loading = false;
          scrollToBottom();
        },
        (error) => {
          aiMsg.content = `调用失败：${error?.message || '未知错误'}`;
          aiMsg.loading = false;
          sending.value = false;
        },
        () => {
          aiMsg.loading = false;
          sending.value = false;
          abortController = null;
        },
      );
    } else {
      // 同步调用
      const res = await executeAgentApi(agentId, input);
      const content =
        (res as any)?.content ||
        (res as any)?.data?.content ||
        JSON.stringify(res, null, 2);
      aiMsg.content = content;
      aiMsg.loading = false;
      sending.value = false;
    }
  } catch (e: any) {
    aiMsg.content = `调用失败：${e?.message || '未知错误'}`;
    aiMsg.loading = false;
    sending.value = false;
  }
}

// 停止流式输出
function handleStop() {
  if (abortController) {
    abortController.abort();
    abortController = null;
    sending.value = false;
    // 更新最后一条消息状态
    const lastMsg = messages.value[messages.value.length - 1];
    if (lastMsg?.role === 'assistant') {
      lastMsg.loading = false;
    }
  }
}

// 清空对话
function handleClear() {
  messages.value = [];
}

// 返回列表
function handleBack() {
  router.back();
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

// 回车发送
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

onMounted(fetchAgentDetail);

onUnmounted(() => {
  if (abortController) {
    abortController.abort();
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 顶部栏 -->
    <div class="flex items-center gap-3 px-5 py-3 border-b bg-white">
      <a-button type="text" @click="handleBack">
        <template #icon>
          <span class="text-lg">←</span>
        </template>
      </a-button>
      <div class="flex-1">
        <div class="font-semibold">
          {{ agentInfo?.name || agentId }}
        </div>
        <div class="text-xs text-gray-400">
          {{ agentInfo?.description || '加载中...' }}
        </div>
      </div>
      <a-switch
        v-model:checked="streamMode"
        checked-children="流式"
        un-checked-children="同步"
      />
      <a-button size="small" @click="handleClear">清空</a-button>
    </div>

    <!-- 消息区域 -->
    <div
      ref="chatContainer"
      class="flex-1 overflow-y-auto px-5 py-4 space-y-4"
    >
      <a-empty
        v-if="messages.length === 0"
        description="开始对话吧"
        class="mt-20"
      />

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="[
          'flex',
          msg.role === 'user' ? 'justify-end' : 'justify-start',
        ]"
      >
        <div
          :class="[
            'max-w-[70%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap break-words',
            msg.role === 'user'
              ? 'bg-blue-500 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-800 rounded-bl-sm',
          ]"
        >
          <div v-if="msg.loading && !msg.content" class="flex items-center gap-2">
            <a-spin size="small" />
            <span class="text-gray-400">思考中...</span>
          </div>
          <span v-else>{{ msg.content }}</span>
          <span
            v-if="msg.loading && msg.content"
            class="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse"
          />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="px-5 py-3 border-t bg-white">
      <div class="flex gap-2">
        <a-textarea
          v-model:value="inputText"
          :placeholder="sending ? '正在调用 Agent...' : '输入消息，Enter 发送'"
          :auto-size="{ minRows: 1, maxRows: 4 }"
          :disabled="sending"
          @keydown="handleKeyDown"
        />
        <a-button
          v-if="sending && streamMode"
          danger
          @click="handleStop"
        >
          停止
        </a-button>
        <a-button
          v-else
          type="primary"
          :loading="sending"
          :disabled="!inputText.trim()"
          @click="handleSend"
        >
          发送
        </a-button>
      </div>
    </div>
  </div>
</template>

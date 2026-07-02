<script setup lang="ts">
import { ref } from 'vue';
import { NCard, NForm, NFormItem, NSelect, NInput, NButton, NSpace, NRadioGroup, NRadio, useMessage } from 'naive-ui';
import { chat, chatStream } from '#/api/agent/chat';
import { getPlatformOptions } from '#/api/common/platform';

const message = useMessage();

const platforms = ref<{ label: string; value: string }[]>([]);
const platform = ref('SILICON_FLOW');
const model = ref('');
const prompt = ref('');
const mode = ref<'sync' | 'stream'>('sync');
const result = ref('');
const loading = ref(false);

async function loadPlatforms() {
  try {
    const list = await getPlatformOptions();
    platforms.value = (list || []).map((p: any) => ({ label: p.name, value: p.code || p.name }));
  } catch {
    platforms.value = [
      { label: 'SiliconFlow', value: 'SILICON_FLOW' },
      { label: 'DeepSeek', value: 'DEEPSEEK' },
      { label: 'OpenAI', value: 'OPENAI' },
    ];
  }
}

async function handleSend() {
  if (!prompt.value) { message.warning('请输入对话内容'); return; }
  loading.value = true;
  result.value = '';

  try {
    if (mode.value === 'sync') {
      const res = await chat({ platform: platform.value, model: model.value || undefined, prompt: prompt.value });
      result.value = res?.content || JSON.stringify(res);
    } else {
      result.value = '';
      await chatStream(
        { platform: platform.value, model: model.value || undefined, prompt: prompt.value },
        (text: string) => { result.value += text; },
      );
    }
  } catch (e: any) {
    result.value = '错误: ' + (e.message || '未知错误');
  } finally { loading.value = false; }
}

loadPlatforms();
</script>

<template>
  <NCard title="AI 对话调试" :bordered="false" class="h-full">
    <NForm label-placement="left" label-width="100">
      <NFormItem label="平台">
        <NSelect v-model:value="platform" :options="platforms" filterable style="width:250px" />
      </NFormItem>
      <NFormItem label="模式">
        <NRadioGroup v-model:value="mode">
          <NRadio value="sync">同步</NRadio>
          <NRadio value="stream">流式 (SSE)</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem label="Prompt">
        <NInput v-model:value="prompt" type="textarea" rows="4" placeholder="输入对话内容..." />
      </NFormItem>
      <NFormItem>
        <NSpace>
          <NButton type="primary" :loading="loading" @click="handleSend">发送</NButton>
          <NButton @click="() => { prompt = ''; result = ''; }">清空</NButton>
        </NSpace>
      </NFormItem>
    </NForm>
    <NCard v-if="result" title="返回结果" size="small" class="mt-4">
      <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
    </NCard>
  </NCard>
</template>

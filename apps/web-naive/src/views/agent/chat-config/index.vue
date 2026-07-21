<script setup lang="ts">
import { ref } from 'vue';

import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  useMessage,
} from 'naive-ui';

import { chat, chatStream } from '#/api/agent/chat';
import { getPlatformOptions } from '#/api/agent/platform';
import { $t } from '#/locales';

const message = useMessage();

const platforms = ref<{ label: string; value: string }[]>([]);
const platform = ref('SILICON_FLOW');
const model = ref('');
const prompt = ref('');
const mode = ref<'stream' | 'sync'>('sync');
const result = ref('');
const loading = ref(false);

async function loadPlatforms() {
  try {
    const list = await getPlatformOptions();
    platforms.value = (list || []).map((p: any) => ({
      label: p.name,
      value: p.code || p.name,
    }));
  } catch {
    platforms.value = [
      { label: 'SiliconFlow', value: 'SILICON_FLOW' },
      { label: 'DeepSeek', value: 'DEEPSEEK' },
      { label: 'OpenAI', value: 'OPENAI' },
    ];
  }
}

async function handleSend() {
  if (!prompt.value) {
    message.warning($t('agent.chatConfigInputPrompt'));
    return;
  }
  loading.value = true;
  result.value = '';

  try {
    if (mode.value === 'sync') {
      const res = await chat({
        platform: platform.value,
        model: model.value || undefined,
        prompt: prompt.value,
      });
      result.value = res?.content || JSON.stringify(res);
    } else {
      result.value = '';
      await chatStream(
        {
          platform: platform.value,
          model: model.value || undefined,
          prompt: prompt.value,
        },
        (text: string) => {
          result.value += text;
        },
      );
    }
  } catch (e: any) {
    result.value = $t('agent.chatConfigError', {
      message: e.message || $t('agent.chatConfigUnknownError'),
    });
  } finally {
    loading.value = false;
  }
}

loadPlatforms();
</script>

<template>
  <NCard :title="$t('agent.chatConfigTitle')" :bordered="false" class="h-full">
    <NForm label-placement="left" label-width="100">
      <NFormItem :label="$t('agent.chatConfigPlatform')">
        <NSelect
          v-model:value="platform"
          :options="platforms"
          filterable
          style="width: 250px"
        />
      </NFormItem>
      <NFormItem :label="$t('agent.chatConfigMode')">
        <NRadioGroup v-model:value="mode">
          <NRadio value="sync">{{ $t('agent.chatConfigSync') }}</NRadio>
          <NRadio value="stream">{{ $t('agent.chatConfigStream') }}</NRadio>
        </NRadioGroup>
      </NFormItem>
      <NFormItem :label="$t('agent.chatConfigPrompt')">
        <NInput
          v-model:value="prompt"
          type="textarea"
          rows="4"
          :placeholder="$t('agent.chatConfigPromptPlaceholder')"
        />
      </NFormItem>
      <NFormItem>
        <NSpace>
          <NButton type="primary" :loading="loading" @click="handleSend">
            {{ $t('agent.chatConfigSend') }}
          </NButton>
          <NButton
            @click="
              () => {
                prompt = '';
                result = '';
              }
            "
          >
            {{ $t('agent.chatConfigClear') }}
          </NButton>
        </NSpace>
      </NFormItem>
    </NForm>
    <NCard
      v-if="result"
      :title="$t('agent.chatConfigResult')"
      size="small"
      class="mt-4"
    >
      <pre class="whitespace-pre-wrap text-sm">{{ result }}</pre>
    </NCard>
  </NCard>
</template>

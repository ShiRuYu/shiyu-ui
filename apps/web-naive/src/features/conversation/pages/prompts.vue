<script setup lang="ts">
import type { PromptSummary } from '#/features/conversation';

import { onMounted, onUnmounted, ref } from 'vue';

import {
  NAlert,
  NButton,
  NCard,
  NEmpty,
  NInput,
  NList,
  NListItem,
  NSpace,
  NTag,
  useMessage,
} from 'naive-ui';

import {
  createPrompt,
  listPrompts,
  previewPrompt,
} from '#/features/conversation';
import { PlatformWorkspaceShell } from '#/shared';

const notice = useMessage();
const prompts = ref<PromptSummary[]>([]);
const loading = ref(false);
const saving = ref(false);
const loadError = ref('');
const title = ref('');
const template = ref('');
const preview = ref('');
const previewing = ref(false);
let disposed = false;
let latestLoadRequest = 0;
let latestPreviewRequest = 0;

async function load() {
  const requestId = ++latestLoadRequest;
  loading.value = true;
  loadError.value = '';
  try {
    const result = (await listPrompts()) ?? [];
    if (disposed || requestId !== latestLoadRequest) return;
    prompts.value = result;
  } catch {
    if (disposed || requestId !== latestLoadRequest) return;
    loadError.value = 'Prompt 列表加载失败，请稍后重试';
  } finally {
    if (!disposed && requestId === latestLoadRequest) loading.value = false;
  }
}
async function save() {
  if (saving.value) return;
  if (!title.value.trim() || !template.value.trim())
    return notice.warning('请输入名称和模板');
  saving.value = true;
  try {
    await createPrompt({
      name: title.value.trim(),
      template: template.value,
      variables: [],
    });
    if (disposed) return;
    title.value = '';
    template.value = '';
    await load();
    if (!disposed) notice.success('Prompt 草稿已保存');
  } catch {
    if (!disposed) notice.error('Prompt 保存失败，请稍后重试');
  } finally {
    if (!disposed) saving.value = false;
  }
}
async function previewTemplate() {
  if (!template.value.trim()) return;
  const requestId = ++latestPreviewRequest;
  previewing.value = true;
  try {
    const result = await previewPrompt({
      template: template.value,
      variables: {},
    });
    if (disposed || requestId !== latestPreviewRequest) return;
    preview.value = result.content;
  } catch {
    if (disposed || requestId !== latestPreviewRequest) return;
    preview.value = '预览失败，请检查模板变量';
  } finally {
    if (!disposed && requestId === latestPreviewRequest) {
      previewing.value = false;
    }
  }
}
onMounted(() => {
  void load();
});

onUnmounted(() => {
  disposed = true;
  latestLoadRequest += 1;
  latestPreviewRequest += 1;
});
</script>

<template>
  <PlatformWorkspaceShell
    eyebrow="Prompt Engineering"
    title="Prompt Studio"
    description="管理模板、变量、版本和运行预览；已发布版本不可原地修改。"
    mode="builder"
  >
    <div class="prompt-grid">
      <NCard title="Prompt 草稿">
        <NSpace vertical>
          <NInput v-model:value="title" placeholder="Prompt 名称" />
          <NInput
            v-model:value="template"
            type="textarea"
            :autosize="{ minRows: 8, maxRows: 18 }"
            placeholder="输入结构化 Prompt 模板，例如：{{question}}"
          />
          <NSpace>
            <NButton type="primary" :loading="saving" @click="save">
              保存草稿
</NButton
            ><NButton :loading="previewing" @click="previewTemplate">
              预览
            </NButton>
          </NSpace>
          <NAlert v-if="preview" type="info" :bordered="false">
            {{ preview }}
          </NAlert>
        </NSpace>
      </NCard>
      <NCard title="模板版本">
        <NAlert v-if="loadError" type="error" :bordered="false">
          {{ loadError }}
        </NAlert>
        <NEmpty v-if="!prompts.length" description="暂无 Prompt 模板" />
        <NList v-else :loading="loading" bordered>
          <NListItem v-for="item in prompts" :key="item.id">
            <NSpace justify="space-between" align="center" style="width: 100%">
              <span>{{ item.name }}</span
              ><NTag size="small">{{ item.status || 'DRAFT' }}</NTag>
            </NSpace>
          </NListItem>
        </NList>
      </NCard>
    </div>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.prompt-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 16px;
}

@media (max-width: 800px) {
  .prompt-grid {
    grid-template-columns: 1fr;
  }
}
</style>

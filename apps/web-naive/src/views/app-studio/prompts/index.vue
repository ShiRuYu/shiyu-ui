<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NAlert, NButton, NCard, NEmpty, NInput, NList, NListItem, NSpace, NTag, useMessage } from 'naive-ui';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';
import { createPrompt, listPrompts, previewPrompt, type PromptSummary } from '#/api/prompt';

const notice = useMessage();
const prompts = ref<PromptSummary[]>([]);
const loading = ref(false);
const title = ref('');
const template = ref('');
const preview = ref('');
const previewing = ref(false);

async function load() {
  loading.value = true;
  try { prompts.value = (await listPrompts()) ?? []; } finally { loading.value = false; }
}
async function save() {
  if (!title.value.trim() || !template.value.trim()) return notice.warning('请输入名称和模板');
  await createPrompt({ name: title.value.trim(), template: template.value, variables: [] });
  title.value = ''; template.value = ''; await load(); notice.success('Prompt 草稿已保存');
}
async function previewTemplate() {
  if (!template.value.trim()) return;
  previewing.value = true;
  try { preview.value = (await previewPrompt({ template: template.value, variables: {} })).content; }
  catch { preview.value = '预览失败，请检查模板变量'; }
  finally { previewing.value = false; }
}
onMounted(load);
</script>

<template>
  <PlatformWorkspaceShell eyebrow="Prompt Engineering" title="Prompt Studio" description="管理模板、变量、版本和运行预览；已发布版本不可原地修改。" mode="builder">
    <div class="prompt-grid">
      <NCard title="Prompt 草稿">
        <NSpace vertical>
          <NInput v-model:value="title" placeholder="Prompt 名称" />
          <NInput v-model:value="template" type="textarea" :autosize="{ minRows: 8, maxRows: 18 }" placeholder="输入结构化 Prompt 模板，例如：{{question}}" />
          <NSpace><NButton type="primary" @click="save">保存草稿</NButton><NButton :loading="previewing" @click="previewTemplate">预览</NButton></NSpace>
          <NAlert v-if="preview" type="info" :bordered="false">{{ preview }}</NAlert>
        </NSpace>
      </NCard>
      <NCard title="模板版本">
        <NEmpty v-if="!prompts.length" description="暂无 Prompt 模板" />
        <NList v-else :loading="loading" bordered>
          <NListItem v-for="item in prompts" :key="item.id"><NSpace justify="space-between" align="center" style="width:100%"><span>{{ item.name }}</span><NTag size="small">{{ item.status || 'DRAFT' }}</NTag></NSpace></NListItem>
        </NList>
      </NCard>
    </div>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.prompt-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); gap: 16px; }
@media (max-width: 800px) { .prompt-grid { grid-template-columns: 1fr; } }
</style>

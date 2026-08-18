<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { NAlert, NButton, NEmpty, NList, NListItem, NSpin } from 'naive-ui';

import {
  getKnowledgeSpaceOptions,
  type KnowledgeSpace,
} from '#/api/knowledge/space';
import PlatformWorkspaceShell from '#/views/common/platform-workspace-shell.vue';
const spaces = ref<KnowledgeSpace[]>([]);
const router = useRouter();
const loading = ref(false);
const error = ref(false);
onMounted(async () => {
  loading.value = true;
  try {
    spaces.value = (await getKnowledgeSpaceOptions()) ?? [];
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>
<template>
  <PlatformWorkspaceShell
    eyebrow="Knowledge Center"
    title="知识中心"
    description="知识空间、文档版本、权限、索引任务与图谱洞察统一管理。"
    :metrics="[
      { label: '知识空间', value: String(spaces.length) },
      {
        label: '索引状态',
        value: spaces.length ? '可用' : '待配置',
        tone: spaces.length ? 'success' : 'warning',
      },
      { label: '权限来源', value: '租户隔离' },
      { label: '向量索引', value: 'JVector' },
    ]"
  >
    <NAlert v-if="error" type="warning" :bordered="false">
      知识空间暂时不可用，请检查当前账户权限。
    </NAlert>
    <div v-if="loading" class="loading"><NSpin size="small" /></div>
    <NEmpty v-else-if="!spaces.length" description="暂无可访问知识空间" />
    <NList v-else bordered>
      <NListItem v-for="item in spaces" :key="item.id">
        <span
          ><strong>{{ item.name }}</strong
          ><small
            >{{ item.code }} · {{ item.domainCode || '通用' }}</small
          ></span
        ><template #suffix>
          <NButton
            text
            type="primary"
            @click="
              router.push({
                path: '/knowledge-center/spaces',
                query: { spaceId: String(item.id) },
              })
            "
          >
            打开空间
          </NButton>
        </template>
      </NListItem>
    </NList>
    <template #side>
      <h3>快捷操作</h3>
      <NButton block secondary @click="router.push('/knowledge-center/search')">
        检索实验室
</NButton
      ><NButton block secondary @click="router.push('/knowledge-center/graph')">
        图谱洞察
</NButton
      ><NButton block secondary @click="router.push('/knowledge-center/documents')">
        文档与索引
      </NButton>
    </template>
  </PlatformWorkspaceShell>
</template>

<style scoped>
.loading {
  display: grid;
  place-items: center;
  min-height: 180px;
}
.n-list-item span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.n-list-item small {
  color: #64748b;
}
</style>

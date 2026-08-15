# COMPONENTS.md — 组件开发指南

## 一、组件结构规范

### 页面组件结构

```vue
<script lang="ts" setup>
// 1. 类型导入
import type { ApiType } from '#/api/module';

// 2. Vue 核心 API
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

// 3. Vben 组件/hooks
import { Page } from '@vben/common-ui';

// 4. UI 组件（Naive UI）
import { NButton, NDataTable, NInput } from 'naive-ui';

// 5. 项目内部
import { $t } from '#/locales';
import { fetchData } from '#/api/module';
import { useDeleteConfirm } from '#/composables';

// 6. 本地子组件
import FormModal from './modules/form.vue';

// --- 业务逻辑 ---

// 响应式状态
const loading = ref(false);
const data = ref([]);

// 生命周期
onMounted(() => loadData());

// 方法
async function loadData() {
  /* ... */
}
</script>

<template>
  <Page>
    <!-- 页面内容 -->
  </Page>
</template>
```

### 子组件结构

```vue
<script lang="ts" setup>
// Props
defineProps<{ visible: boolean; record?: RecordType }>();

// Emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

// 业务逻辑...
</script>

<template>
  <!-- 组件模板 -->
</template>
```

## 二、命名规范

| 类型     | 规则       | 示例              |
| -------- | ---------- | ----------------- |
| 组件文件 | PascalCase | `AgentEdit.vue`   |
| 目录     | kebab-case | `chat-config/`    |
| 组件名   | PascalCase | `<AgentList />`   |
| 事件     | kebab-case | `@update-success` |
| Props    | camelCase  | `:search-name`    |
| 方法     | camelCase  | `loadAgents()`    |
| 类型     | PascalCase | `AgentVO`         |

## 三、页面通用模板

### 列表页

```vue
<script lang="ts" setup>
const loading = ref(false);
const data = ref([]);
const pagination = reactive({ page: 1, pageSize: 20, total: 0 });
const searchParams = ref({});

async function loadData() {
  /* fetch + pagination */
}
async function handleSearch() {
  pagination.page = 1;
  loadData();
}
function handleDelete(id: number) {
  /* delete + refresh */
}
</script>

<template>
  <Page>
    <NCard title="搜索">
      <NGrid>
        <!-- 搜索表单项 -->
      </NGrid>
      <NSpace>
        <NButton @click="handleSearch">搜索</NButton>
        <NButton @click="searchParams = {}">重置</NButton>
      </NSpace>
    </NCard>

    <NCard title="列表">
      <template #header-extra>
        <NButton>新增</NButton>
      </template>
      <NDataTable
        :columns="columns"
        :data="data"
        :loading="loading"
        :pagination="pagination"
        @update:page="onPageChange"
      />
    </NCard>
  </Page>
</template>
```

### 表单弹窗

```vue
<script lang="ts" setup>
const props = defineProps<{ visible: boolean; record?: any }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'success'): void }>();

const formRef = ref();
const formData = ref({ ...(props.record ?? {}) });
const saving = ref(false);

async function handleSubmit() {
  saving.value = true;
  try {
    await (props.record
      ? updateApi(formData.value)
      : createApi(formData.value));
    window.$message.success('操作成功');
    emit('success');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <NModal
    :show="visible"
    :title="record ? '编辑' : '新增'"
    @update:show="emit('close')"
  >
    <NForm ref="formRef" :model="formData" label-placement="left">
      <!-- 表单字段 -->
    </NForm>
    <template #footer>
      <NButton @click="emit('close')">取消</NButton>
      <NButton type="primary" :loading="saving" @click="handleSubmit">
        保存
      </NButton>
    </template>
  </NModal>
</template>
```

## 四、页面拆分建议

### agent-edit.vue (1219行) 拆分方案

当前 `agent-edit.vue` 包含了 5 方面功能，建议拆分为：

```
agent/admin/
├── agent-edit.vue        # 主页面容器（~200行）
│   └── 只做布局编排
├── components/
│   ├── AgentBasicInfo.vue      # Agent 基本信息表单（~150行）
│   ├── AgentGraphEditor.vue    # Agent 图配置面板（~300行）
│   ├── AgentVersionManager.vue # 版本管理面板（~200行）
│   ├── AgentNodeConfig.vue     # 节点配置表单（~200行）
│   └── AgentTestPanel.vue      # Agent 测试面板（~150行）
```

## 五、通用组件建议

### SmartTable（待封装）

封装目标：消除各个模块的表格重复代码

```vue
<SmartTable
  :columns="columns"
  :fetch-fn="fetchData"
  :search-schemas="searchSchemas"
  :batch-actions="['delete', 'export']"
  @row-edit="handleEdit"
  @row-delete="handleDelete"
/>
```

内置能力：

- ✅ 分页管理
- ✅ 搜索表单
- ✅ 排序
- ✅ 列配置
- ✅ 加载态
- ✅ 空态
- ✅ 批量操作
- ✅ 导出
- ✅ 缓存

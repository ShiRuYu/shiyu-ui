# CODING-STANDARDS.md — 编码规范

## 一、Vue / TypeScript 规范

### 1.1 使用 Composition API + `<script setup>`

```vue
<script lang="ts" setup>
// ✅ 推荐
import { ref, computed } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);
</script>
```

### 1.2 类型优先

```ts
// ✅ 推荐：使用 interface 定义类型
export interface AgentVO {
  id: number;
  name: string;
  status: "active" | "inactive";
  config?: Record<string, any>;
}

// ✅ 推荐：API 层类型放在各自的 namespace 中
export namespace AgentApi {
  export interface AgentVO { ... }
  export interface AgentCreateReq { ... }
}
```

### 1.3 组件命名

```ts
// ✅ 推荐：PascalCase 组件名
import AgentEditForm from './components/AgentEditForm.vue';

// ✅ 推荐：组件名与文件名一致
```

### 1.4 导入顺序

```ts
// 1. 类型导入
import type { ApiType } from '#/api/module';

// 2. 外部库
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

// 3. Vben 框架
import { Page } from '@vben/common-ui';

// 4. UI 组件库
import { NButton, NDataTable } from 'naive-ui';

// 5. 项目内部模块
import { $t } from '#/locales';
import { fetchApi } from '#/api/module';

// 6. 本地组件
import FormModal from './modules/form.vue';
```

## 二、文件命名规范

| 文件类型   | 规范       | 示例                  |
| ---------- | ---------- | --------------------- |
| Vue 组件   | PascalCase | `AgentList.vue`       |
| TypeScript | kebab-case | `index-rebuild.ts`    |
| CSS/SCSS   | kebab-case | `page-layout.scss`    |
| 数据/类型  | kebab-case | `data.ts`             |
| Store      | kebab-case | `auth.ts`             |
| Composable | camelCase  | `useCrudFormModal.ts` |
| API 模块   | kebab-case | `document.ts`         |

## 三、目录结构规范

### 模块目录

```
模块/
├── index.vue            # 主页面（或 list.vue）
├── data.ts              # 类型定义 + 列配置 + API
├── components/          # 模块内的通用组件
│   ├── AgentList.vue
│   └── AgentCard.vue
└── modules/             # 弹窗/抽屉类子组件
    ├── form.vue
    └── detail.vue
```

### 文件大小规范

| 文件       |  上限  | 建议                |
| ---------- | :----: | ------------------- |
| Vue 组件   | 500 行 | 超过 300 行考虑拆分 |
| TypeScript | 300 行 | 超过 200 行考虑拆分 |
| CSS        | 200 行 | 超过 150 行拆分     |

## 四、Git 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <description>

feat(agent): add agent streaming execution
fix(knowledge): fix document upload error
refactor(agent): split agent-edit into sub-components
docs: add streaming architecture docs
style(system): fix table alignment
chore: update dependencies
```

### 类型说明

| type     | 说明     |
| -------- | -------- |
| feat     | 新功能   |
| fix      | 修复     |
| refactor | 重构     |
| docs     | 文档     |
| style    | 样式调整 |
| chore    | 工程化   |
| perf     | 性能优化 |
| test     | 测试     |

## 五、API 规范

### 5.1 请求方法命名

```ts
// 查询
async function getAgentPage(params) → GET /agent/page
async function getAgentById(id)    → GET /agent/{id}

// 新增
async function createAgent(data)   → POST /agent

// 更新
async function updateAgent(data)   → PUT /agent

// 删除
async function deleteAgent(id)     → DELETE /agent/{id}
```

### 5.2 统一返回类型

```ts
// 分页响应
interface PageResult<T> {
  records: T[];
  total: number;
  page: number;
  pageSize: number;
}

// 统一响应
interface ApiResult<T> {
  code: number;
  message: string;
  data: T;
}
```

## 六、国际化规范

### 使用 `$t` 函数

```vue
<script lang="ts" setup>
import { $t } from '#/locales';
</script>

<template>
  <NButton>{{ $t('agent.create') }}</NButton>
</template>
```

### 语言包结构

```json
// locales/langs/zh-CN/agent.json
{
  "agent": {
    "title": "Agent 管理",
    "create": "创建 Agent",
    "edit": "编辑 Agent",
    "delete": "删除",
    "status": {
      "active": "运行中",
      "inactive": "已停用"
    }
  }
}
```

## 七、错误处理

### API 错误

```ts
// 由 request.ts 统一拦截处理
// 业务层无需重复 try-catch
async function loadData() {
  const res = await getAgentPage(params);
  data.value = res.records;
}
```

### 页面级错误

```ts
async function handleSubmit() {
  try {
    saving.value = true;
    await createAgent(formData.value);
    window.$message.success('创建成功');
    emit('success');
  } catch (error) {
    window.$message.error((error as Error)?.message ?? '操作失败');
  } finally {
    saving.value = false;
  }
}
```

# shiyu-ui 开发文档

> **版本**: 2.0.0  
> **框架**: Vue 3 + Vben Admin 5.x + Naive UI  
> **应用**: `web-naive`（管理后台 — 覆盖全部后端 API）| `web-client`（用户前台 — 消费入口）  
> **后端 API**: 27 个 Controller，210+ 端点（6 个后端模块全部纳入管理后台）  
> **最后更新**: 2026-07-02

---

## 一、环境搭建

### 1.1 前置要求

```bash
node >= 22.0
pnpm >= 10.0
```

### 1.2 克隆与安装

```bash
git clone git@github.com:ShiRuYu/shiyu-ui.git
cd shiyu-ui && pnpm install
```

### 1.3 启动

```bash
# 管理后台
cd apps/web-naive && pnpm dev    # 端口 5888
# 用户前台
cd apps/web-client && pnpm dev   # 端口 5889
# 清缓存 (页面空白第一步)
rm -rf node_modules/.vite && pnpm dev
```

---

## 二、后端架构速查

### 2.1 模块端口与 API 前缀

| 后端模块 | 端口 | API 根路径 | Controller 数 | API 数 | 纳入管理后台 |
|---------|------|-----------|--------------|-------|------------|
| shiyu-ai-agent | 9000 | `/admin/agent`, `/api/agent`, `/ai/*`, `/intent/*` | 8 | 60+ | ✅ |
| shiyu-ai-auth | 9002 | `/auth`, `/user`, `/role`, `/menu`, `/workspace`, `/tenant`, `/dict`, `/timezone` | 10 | 60+ | ✅ |
| shiyu-ai-core | 9001 | `/api/chat` | 1 | 5 | ✅ 配置 |
| shiyu-ai-record | 9005 | `/api/profile`, `/api/timeline`, `/api/media`, `/api/tag`, `/api/record` | 5 | 18 | ✅ |
| shiyu-ai-knowledge | 9006 | `/api/v1/knowledge`, `/api/v1/knowledge/documents` | 2 | 25 | ✅ |
| shiyu-ai-education | 9007 | `/api/v1/subject`, `/api/v1/textbook`, ... | 11 | 56 | ✅ 规划 |
| shiyu-common-web | - | `/upload` | 1 | 1 | ✅ |

### 2.2 API 前缀鉴权规则

| 前缀 | 鉴权 | 管理后台用途 |
|------|------|-------------|
| `/admin/*` | Sa-Token admin role | Agent CRUD, Graph 编排, 版本管理, 节点类型 |
| `/api/*` | Sa-Token login | Agent 执行, 日常记录CRUD, 对话, 知识库 |
| `/auth/*` | 部分无登录 | 登录/登出/刷新Token/切换租户空间 |
| `/ai/*` | Sa-Token login | 平台/模型 CRUD |
| `/upload` | Sa-Token login | 文件上传 |

---

## 三、添加新功能标准流程

### 3.1 管理后台添加新页面（后端路由模式 + CRUD 模板）

**Step 1: 创建视图文件**

```bash
# 以知识库管理为例
mkdir -p apps/web-naive/src/views/knowledge
touch apps/web-naive/src/views/knowledge/list.vue
touch apps/web-naive/src/views/knowledge/data.ts
touch apps/web-naive/src/views/knowledge/modules/form.vue
```

**Step 2: 创建 API 模块**

```typescript
// api/knowledge/index.ts
import { requestClient } from '#/api/request';

export function getKnowledgePageApi(params: Recordable) {
  return requestClient.get<PageResult<KnowledgeItem>>('/api/v1/knowledge', { params });
}
export function getKnowledgeDetailApi(id: number) {
  return requestClient.get(`/api/v1/knowledge/${id}`);
}
export function createKnowledgeApi(data: any) {
  return requestClient.post('/api/v1/knowledge', data);
}
export function updateKnowledgeApi(id: number, data: any) {
  return requestClient.put(`/api/v1/knowledge/${id}`, data);
}
export function deleteKnowledgeApi(id: number) {
  return requestClient.delete(`/api/v1/knowledge/${id}`);
}
```

**Step 3: 编写列表页**

```vue
<!-- views/knowledge/list.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { NButton, NDataTable, NSpace, NTag } from 'naive-ui';
import { getKnowledgePageApi, deleteKnowledgeApi } from '#/api/knowledge';
import { getTableColumns } from './data';
import FormModal from './modules/form.vue';

const tableData = ref([]);
const loading = ref(false);
const columns = getTableColumns();
const formModalRef = ref();

async function fetchData() {
  loading.value = true;
  try {
    const res = await getKnowledgePageApi({ page: 1, pageSize: 20 });
    tableData.value = res?.items || [];
  } finally { loading.value = false; }
}

onMounted(fetchData);
</script>
```

**Step 4: 编写 data.ts**

```typescript
import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm } from 'naive-ui';

export function getTableColumns(): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', width: 200 },
    { title: '学科', key: 'subject', width: 100 },
    { title: '年级', key: 'gradeLevel', width: 100 },
    { title: '状态', key: 'status', width: 80 },
    { title: '操作', key: 'actions', width: 200,
      render: (row) => h(NSpace, null, [
        h(NButton, { size: 'small', type: 'primary' }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => deleteKnowledgeApi(row.id) },
          { default: () => '确认删除？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}
```

**Step 5: 编写 modules/form.vue (Modal 表单)**

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { createKnowledgeApi, updateKnowledgeApi } from '#/api/knowledge';

const visible = ref(false);
const formData = ref<any>({});
const isEdit = ref(false);
const emit = defineEmits(['success']);

function open(row?: any) {
  isEdit.value = !!row;
  formData.value = row ? { ...row } : {};
  visible.value = true;
}
async function handleSubmit() {
  if (isEdit.value) await updateKnowledgeApi(formData.value.id, formData.value);
  else await createKnowledgeApi(formData.value);
  visible.value = false;
  emit('success');
}
defineExpose({ open });
</script>
```

**Step 6: 插入 DB 菜单记录**

```sql
-- 在 auth__init.sql 中添加
INSERT INTO menu (name, code, type, parent_id, path, component, show, ...)
VALUES ('知识库管理', 'Knowledge', 'CATALOG', NULL, '/knowledge', 'BasicLayout', TRUE, ...);

INSERT INTO menu (name, code, type, parent_id, path, component, show, ...)
VALUES ('知识点列表', 'KnowledgeList', 'MENU', <knowledge_id>, '/knowledge/list', '/knowledge/list', TRUE, ...);

-- 同时添加到 role_workspace_menu
```

**Step 7: 添加国际化**

```json
// locales/langs/zh-CN/system.json
{ "knowledge": { "title": "知识库管理", "list": "知识点列表" } }
```

### 3.2 用户前台添加新页面（静态路由模式）

```typescript
// apps/web-client/src/router/index.ts
const routes = [
  { path: '/login', component: Login },
  { path: '/chat', component: ChatIndex, meta: { requiresAuth: true } },
  { path: '/chat/:sessionId', component: ChatIndex, meta: { requiresAuth: true } },
  { path: '/agent', component: AgentSquare, meta: { requiresAuth: true } },
  { path: '/agent/:agentId', component: AgentDetail, meta: { requiresAuth: true } },
  { path: '/knowledge', component: KnowledgeIndex, meta: { requiresAuth: true } },
  { path: '/knowledge/:id', component: KnowledgeDetail, meta: { requiresAuth: true } },
  { path: '/space/settings', component: SpaceSettings, meta: { requiresAuth: true } },
  { path: '/space/history', component: ChatHistory, meta: { requiresAuth: true } },
];
```

---

## 四、管理后台功能清单

### 4.1 已完成模块 (21 个模块, 130+ API 端点)

| 菜单 | 页面文件 | API 文件 | 后端 Controller |
|------|---------|---------|----------------|
| Agent管理 | `agent/admin/agent-list.vue` | `api/agent/admin.ts` | AgentAdminController |
| Agent编辑(Graph+版本) | `agent/admin/agent-edit.vue` | `api/agent/graph.ts`, `version.ts` | AgentGraphController, AgentVersionController |
| Agent对话 | `agent/agent/modules/chat.vue` | `api/agent/agent.ts` | AgentController |
| 平台管理 | `agent/platform/list.vue` | `api/common/platform.ts` | AiPlatformController |
| 模型管理 | `agent/model/list.vue` | `api/common/model.ts` | AiModelController |
| 模型对话弹窗 | `agent/model/modules/chat-dialog.vue` | `api/agent/chat.ts` | (前端直连 /api/chat) |
| 意图管理 | `agent/intent/list.vue` | `api/agent/intent-def.ts` | IntentDefController |
| 用户管理 | `system/user/` | `api/system/user.ts` + `core/user.ts` | UserController |
| 角色管理 | `system/role/` | `api/system/role.ts` | RoleController |
| 菜单管理 | `system/menu/` | `api/system/menu.ts` + `core/menu.ts` | MenuController |
| 工作空间管理 | `system/workspace/` | `api/system/workspace.ts` | WorkspaceController |
| 租户管理 | `system/tenant/` | `api/system/tenant.ts` | TenantController |
| 字典管理 | `common/dict/list.vue` | `api/common/dict.ts` | DictController |
| 时区设置 | 个人中心 | `api/core/user.ts` | TimezoneController |
| 人物管理 | `record/profile/` | `api/record/profile.ts` | ProfileController |
| 时间轴管理 | `record/timeline/` | `api/record/timeline.ts` | TimelineEventController |
| 记录管理 | `record/record/` | `api/record/record.ts` | RecordController |
| 媒体管理 | `record/media/` | `api/record/media.ts` | MediaController |
| 标签管理 | `record/tag/` | `api/record/tag.ts` | TagController |
| 仪表盘 | `dashboard/` | - | - |
| 登录/认证 | `_core/authentication/` | `api/core/auth.ts`, `captcha.ts` | AuthController, CaptchaController |

### 4.2 规划中模块 (15 个模块, 80+ API 端点)

| 菜单 | 页面 | API 文件 | 后端 Controller | 优先级 |
|------|------|---------|----------------|--------|
| 知识点管理 | `knowledge/list.vue` | `api/knowledge/index.ts` | KnowledgeController | 🔴 P0 |
| 文档管理 | `knowledge/documents/list.vue` | `api/knowledge/document.ts` | DocumentController | 🔴 P0 |
| 索引管理 | `knowledge/index.vue` | `api/knowledge/index.ts` | KnowledgeController | 🔴 P0 |
| 知识图谱 | `knowledge/graph.vue` | `api/knowledge/index.ts` | KnowledgeController | 🟡 P1 |
| 学科管理 | `education/subject/list.vue` | `api/education/subject.ts` | SubjectController | 🟡 P1 |
| 教材管理 | `education/textbook/list.vue` | `api/education/textbook.ts` | TextbookController | 🟡 P1 |
| 章节管理 | `education/chapter/list.vue` | `api/education/chapter.ts` | ChapterController | 🟡 P1 |
| 课程管理 | `education/course/list.vue` | `api/education/course.ts` | CourseController | 🟡 P1 |
| 试卷管理 | `education/exam/list.vue` | `api/education/exam.ts` | ExamController | 🟡 P1 |
| 题库管理 | `education/question/list.vue` | `api/education/question.ts` | QuestionController | 🟡 P1 |
| 学习计划 | `education/plan/list.vue` | `api/education/plan.ts` | StudyPlanController | 🟢 P2 |
| 复习任务 | `education/review/list.vue` | `api/education/review.ts` | ReviewController | 🟢 P2 |
| 学情分析 | `education/analytics/index.vue` | `api/education/analytics.ts` | AnalyticsController | 🟢 P2 |
| 资源管理 | `education/resource/list.vue` | `api/education/resource.ts` | ResourceController | ⚪ P3 |
| 错题管理 | `education/wrong-question/list.vue` | `api/education/wrong-question.ts` | WrongQuestionController | ⚪ P3 |
| 文件管理 | `file/list.vue` | `api/common/file.ts` | FileController | ⚪ P3 |
| 对话配置 | `agent/chat-config/` | `api/agent/chat.ts` | ChatDemoController | 🔴 P0 |

---

## 五、API 对接规范

### 5.1 请求客户端

```typescript
// 管理后台和用户前台共用 requestClient（自动注入 Bearer Token）
import { requestClient } from '#/api/request';   // web-naive
import { requestClient } from '@vben/effects/request'; // web-client

// JSON CRUD — 自动处理 code=200 解 data
await requestClient.get('/admin/agent/page', { params });
await requestClient.post('/admin/agent', data);
await requestClient.patch(`/admin/agent/${id}`, data);
await requestClient.delete(`/admin/agent/${id}`);

// SSE 流式 — 使用统一工具函数
createSseStream({ url, body, onMessage, onError, onDone }) → AbortController
```

### 5.2 新建 API 模块模板

```typescript
// api/{module}/index.ts
import { requestClient } from '#/api/request';

// 分页查询
export function getPageApi(params: Recordable) {
  return requestClient.get<PageResult<Item>>('/api/v1/{module}/page', { params });
}
// 详情
export function getDetailApi(id: number) {
  return requestClient.get<Item>(`/api/v1/{module}/${id}`);
}
// 创建
export function createApi(data: any) {
  return requestClient.post<Item>('/api/v1/{module}', data);
}
// 更新
export function updateApi(id: number, data: any) {
  return requestClient.put<Item>(`/api/v1/{module}/${id}`, data);
}
// 删除
export function deleteApi(id: number) {
  return requestClient.delete(`/api/v1/{module}/${id}`);
}
// 全部选项
export function getOptionsApi() {
  return requestClient.get<Option[]>('/api/v1/{module}/options');
}
```

### 5.3 CRUD data.ts 模板

```typescript
import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm } from 'naive-ui';

export function getTableColumns(
  onEdit: (row: any) => void,
  onDelete: (id: number) => void,
): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', width: 200 },
    { title: '状态', key: 'status', width: 80 },
    {
      title: '操作', key: 'actions', width: 200, align: 'center',
      render: (row) => h(NSpace, { justify: 'center' }, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, {
          onPositiveClick: () => onDelete(row.id),
        }, {
          default: () => '确认删除该记录？',
          trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除'),
        }),
      ]),
    },
  ];
}
```

---

## 六、调试指南

### 6.1 页面空白排查

```bash
# Step 1: 清 Vite 缓存 (90%)
rm -rf node_modules/.vite && pnpm dev

# Step 2: VueFlow → v-if + onDeactivated
#         大组件 → v-if 暴力重建
#         路由 404 → DB menu 路径 vs view 路径

# Step 3: curl 获取错误
curl -s http://localhost:5888/src/views/agent/admin/agent-edit.vue
```

### 6.2 API 调试

```bash
# 认证
curl -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'

# Agent 列表 (需 Token)
curl -H "Authorization: Bearer xxx" \
  "http://localhost:9000/admin/agent/page?pageNo=1&pageSize=10"

# SSE 流式对话
curl -N -X POST "http://localhost:9000/api/agent/test/executeStream" \
  -H "Authorization: Bearer xxx" \
  -H "Content-Type: application/json" \
  -d '{"query":"你好"}'

# 知识库搜索
curl -H "Authorization: Bearer xxx" \
  "http://localhost:9006/api/v1/knowledge/search?query=数学&topK=10"
```

### 6.3 常见问题

| 问题 | 原因 | 修复 |
|------|------|------|
| SSE 401 | fetch 绕过拦截器 | 手动注入 `useAccessStore().accessToken` |
| SSE 连接失败 | baseURL 错误 | `requestClient.getBaseUrl()` |
| 响应 code 异常 | successCode 不匹配 | 后端 `BizResultCode.SUC=200` |
| ApiSelect 不加载 | api 传字符串 | 传函数引用 |
| 菜单重复 | mixed + 静态路由 | 删除 modules/*.ts |
| 页面白屏 | Vite 缓存 | `rm -rf node_modules/.vite` |
| VueFlow Tab 白屏 | Transition 冲突 | `v-if` + `onDeactivated` |
| Graph 保存字段丢失 | 缺 11 字段 | 检查 buildGraphConfig() |
| 路由 404 | DB menu 路径不对 | 检查 menu.path vs view 路径 |

---

## 七、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.0.0 | 2026-07-02 | 初始版本 |
| 1.1.0 | 2026-07-02 | 新增 dual-app 架构 |
| 2.0.0 | 2026-07-02 | 管理后台覆盖全部 27 个后端 Controller、210+ API 端点；新增知识库/教育/文件管理规划模块；功能清单区分已完成(21模块)和规划中(15模块) |


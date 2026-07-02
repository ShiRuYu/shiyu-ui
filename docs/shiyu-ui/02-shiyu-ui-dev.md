# shiyu-ui 开发文档 — 后端管理开发指南

> **版本**: 3.0.0  
> **管理后台**: `apps/web-naive`（Vben Admin 5.x + Naive UI）  
> **后端**: 38 个 Controller 全部实现 / 280+ API 端点  
> **前端已完成**: 28 页 / 20 模块  
> **前端待建**: 18 页 / 16 模块  
> **最后更新**: 2026-07-02

---

## 一、开发环境

```bash
cd /root/shiyu-ui && pnpm install
cd apps/web-naive && pnpm dev    # 管理后台 :5888
# 清缓存
rm -rf node_modules/.vite && pnpm dev
```

---

## 二、现有功能总览

### 2.1 已有页面清单（28页）

| 模块 | 文件 | 后端 Controller |
|------|------|----------------|
| **智能体** (13页) | | |
| Agent列表 | `views/agent/admin/agent-list.vue` | AgentAdminController |
| Agent编辑(Graph+版本) | `views/agent/admin/agent-edit.vue` | AgentGraphController, AgentVersionController |
| Agent表单 | `views/agent/admin/agent-form.vue` | AgentAdminController |
| 节点编辑弹窗 | `views/agent/admin/modules/node-form.vue` | NodeTypeController |
| 校验结果弹窗 | `views/agent/admin/modules/validate-result.vue` | AgentGraphController |
| 对话Modal | `views/agent/agent/modules/chat.vue` | AgentController |
| 平台列表 | `views/agent/platform/list.vue` | AiPlatformController |
| 平台表单 | `views/agent/platform/modules/form.vue` | AiPlatformController |
| 模型列表 | `views/agent/model/list.vue` | AiModelController |
| 模型表单 | `views/agent/model/modules/form.vue` | AiModelController |
| 对话弹窗 | `views/agent/model/modules/chat-dialog.vue` | ChatDemoController |
| 意图列表 | `views/agent/intent/list.vue` | IntentDefController |
| 意图表单 | `views/agent/intent/modules/form.vue` | IntentDefController |
| **系统管理** (13页) | | |
| 用户列表+表单 | `views/system/user/` | UserController |
| 角色列表+表单(NTree) | `views/system/role/` | RoleController |
| 菜单列表+表单 | `views/system/menu/` | MenuController |
| 工作空间列表+表单 | `views/system/workspace/` | WorkspaceController |
| 租户列表+表单 | `views/system/tenant/` | TenantController |
| 字典列表+表单 | `views/common/dict/` | DictController |
| 时区设置 | `views/_core/profile/` | TimezoneController |
| **日常记录** (10页) | | |
| 人物列表+表单 | `views/record/profile/` | ProfileController |
| 时间轴列表+表单 | `views/record/timeline/` | TimelineEventController |
| 记录列表+表单 | `views/record/records/` | RecordController |
| 媒体列表+表单 | `views/record/media/` | MediaController |
| 标签列表+表单 | `views/record/tags/` | TagController |
| **其他** (2页) | | |
| 登录 | `views/_core/authentication/login.vue` | AuthController + CaptchaController |
| 仪表盘 | `views/dashboard/` | — |

### 2.2 已有API模块

```
api/
├── agent/        admin.ts agent.ts chat.ts graph.ts intent-def.ts node-type.ts version.ts
├── common/       dict.ts model.ts platform.ts timezone.ts
├── core/         auth.ts captcha.ts menu.ts user.ts
├── record/       media.ts profile.ts records.ts tag.ts timeline.ts
├── system/       menu.ts role.ts tenant.ts upload.ts user.ts workspace.ts
└── request.ts
```

---

## 三、待建功能开发指引

### 3.1 知识库管理（P0 — 5页需新建）

**需创建的文件：**

```
api/knowledge/
├── index.ts          — 19个API (KnowledgeController)
└── document.ts       — 6个API (DocumentController)

views/knowledge/
├── list.vue
├── modules/form.vue
├── relation.vue
├── graph.vue
├── document/list.vue
├── document/modules/form.vue
└── index.vue
```

**后端 API 调用速查：**

```typescript
// 知识点CRUD
import { requestClient } from '#/api/request';

// 列表（后端GET /api/v1/knowledge — 注意不是/page 后缀）
await requestClient.get('/api/v1/knowledge', { params: { category: 'MATH' } });
// 详情
await requestClient.get('/api/v1/knowledge/1');
// 创建
await requestClient.post('/api/v1/knowledge', { code: 'math_algebra', name: '代数', ... });
// 更新
await requestClient.put('/api/v1/knowledge/1', { ... });
// 删除
await requestClient.delete('/api/v1/knowledge/1');

// 知识关系
await requestClient.post('/api/v1/knowledge/relation', { sourceId: 1, targetId: 2, type: 'PRE', weight: 1.0 });
await requestClient.delete('/api/v1/knowledge/relation', { params: { sourceId: 1, targetId: 2, type: 'PRE' } });

// 知识图谱
await requestClient.get('/api/v1/knowledge/1/graph');

// 文档CRUD
await requestClient.get('/api/v1/knowledge/documents/by-knowledge/1');
await requestClient.post('/api/v1/knowledge/documents', { title: '...', content: '...', docType: 'ARTICLE' });

// 索引管理
await requestClient.post('/api/v1/knowledge/rebuild-index');
await requestClient.get('/api/v1/knowledge/rebuild-index/taskId');
await requestClient.get('/api/v1/knowledge/rebuild-index');
await requestClient.delete('/api/v1/knowledge/index');
```

### 3.2 教育管理（P1-P2 — 11页需新建）

**需创建的文件：**

```
api/education/
├── subject.ts          — 7 API
├── textbook.ts         — 6 API
├── chapter.ts          — 6 API
├── course.ts           — 7 API
├── exam.ts             — 6 API
├── question.ts         — 6 API
├── plan.ts             — 7 API
├── review.ts           — 5 API
├── analytics.ts        — 6 API
├── resource.ts         — 6 API
└── wrong-question.ts   — 5 API

views/education/
├── subject/      list.vue + modules/form.vue
├── textbook/     list.vue + modules/form.vue
├── chapter/      list.vue + modules/form.vue  (NTree树形)
├── course/       list.vue + modules/form.vue
├── exam/         list.vue + modules/form.vue
├── question/     list.vue + modules/form.vue
├── plan/         list.vue + modules/form.vue
├── review/       list.vue + modules/form.vue
├── analytics/    index.vue  (ECharts看板)
├── resource/     list.vue + modules/form.vue
└── wrong-question/ list.vue  (只读列表)
```

**后端 API 调用速查：**

```typescript
// 学科
await requestClient.get('/api/v1/subject');
await requestClient.get('/api/v1/subject/1');
await requestClient.post('/api/v1/subject', { code: 'MATH', name: '数学', ... });
await requestClient.put('/api/v1/subject/1', { ... });
await requestClient.delete('/api/v1/subject/1');

// 教材（按学科/年级查）
await requestClient.get('/api/v1/textbook/subject/MATH/grade/7');
await requestClient.post('/api/v1/textbook', { ... });

// 章节树（关键：用NTree展示）
await requestClient.get('/api/v1/chapter/textbook/1/tree');
// 返回: [{ id, name, children: [{ id, name, children: [...] }] }]

// 课程
await requestClient.get('/api/v1/course');
await requestClient.get('/api/v1/course/subject/MATH');
await requestClient.get('/api/v1/course/grade/7');

// 试卷
await requestClient.get('/api/v1/exam/subject/MATH');
await requestClient.post('/api/v1/exam/1/submit', { answers: [...] });

// 题库
await requestClient.get('/api/v1/question/subject/MATH/grade/7');
await requestClient.get('/api/v1/question/difficulty/1');
await requestClient.get('/api/v1/question/type/SINGLE_CHOICE');

// 学情分析
await requestClient.get('/api/v1/analytics/overview', { params: { studentId: 1 } });
await requestClient.get('/api/v1/analytics/ability-radar', { params: { studentId: 1, knowledgeId: 1 } });
await requestClient.get('/api/v1/analytics/weak-points', { params: { studentId: 1 } });
await requestClient.get('/api/v1/analytics/trend', { params: { studentId: 1 } });
```

### 3.3 章节树形展示（教育模块特有模式）

```vue
<!-- views/education/chapter/list.vue — 树形展示模式 -->
<script setup lang="ts">
import { NTree, NButton, NSpace } from 'naive-ui';
import { getChapterTreeApi, deleteChapterApi } from '#/api/education/chapter';
import FormModal from './modules/form.vue';

const treeData = ref([]);
const selectedTextbookId = ref(1);

async function loadTree() {
  const res = await getChapterTreeApi(selectedTextbookId.value);
  // 转为 NTree 需要的格式: { key, label, children }
  treeData.value = formatTree(res);
}

function formatTree(nodes: any[]): any[] {
  return nodes.map(n => ({
    key: n.id,
    label: n.name,
    children: n.children ? formatTree(n.children) : undefined,
  }));
}
</script>

<template>
  <NSpace vertical>
    <NButton @click="() => formModalRef.open(null, selectedTextbookId)">新增章节</NButton>
    <NTree :data="treeData" block-line selectable />
  </NSpace>
</template>
```

### 3.4 学情分析看板（ECharts 模式）

```vue
<!-- views/education/analytics/index.vue -->
<script setup lang="ts">
import { onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { getOverviewApi, getAbilityRadarApi, getWeakPointsApi, getTrendApi } from '#/api/education/analytics';

const studentId = ref(1);
const overview = ref<any>({});
const weakPoints = ref([]);
const trend = ref([]);

onMounted(async () => {
  overview.value = await getOverviewApi(studentId.value);
  weakPoints.value = await getWeakPointsApi(studentId.value);
  trend.value = await getTrendApi(studentId.value);
  renderRadarChart();
  renderTrendChart();
});

function renderRadarChart() { /* ECharts 雷达图 */ }
function renderTrendChart() { /* ECharts 折线图 */ }
</script>
```

---

## 四、开发标准模式

### 4.1 新建 CRUD 模块标准步骤

```bash
# 1. 创建 API 文件
touch apps/web-naive/src/api/{module}/{name}.ts

# 2. 创建视图文件
mkdir -p apps/web-naive/src/views/{module}/{name}/modules
touch apps/web-naive/src/views/{module}/{name}/list.vue
touch apps/web-naive/src/views/{module}/{name}/modules/form.vue
```

### 4.2 API 文件标准模板

```typescript
import { requestClient } from '#/api/request';

export function getPageApi(params: Recordable) {
  return requestClient.get<PageResult<Item>>('/api/v1/{module}/page', { params });
}
export function getDetailApi(id: number) {
  return requestClient.get<Item>(`/api/v1/{module}/${id}`);
}
export function createApi(data: any) {
  return requestClient.post('/api/v1/{module}', data);
}
export function updateApi(id: number, data: any) {
  return requestClient.put(`/api/v1/{module}/${id}`, data);
}
export function deleteApi(id: number) {
  return requestClient.delete(`/api/v1/{module}/${id}`);
}
export function getOptionsApi() {
  return requestClient.get<Option[]>('/api/v1/{module}/options');
}
```

### 4.3 列定义标准模板

```typescript
import { h } from 'vue';
import type { DataTableColumns } from 'naive-ui';
import { NButton, NSpace, NPopconfirm, NTag } from 'naive-ui';
import type { VbenFormSchema } from '#/adapter';

export function getTableColumns(onEdit: any, onDelete: any): DataTableColumns<any> {
  return [
    { title: 'ID', key: 'id', width: 80 },
    { title: '名称', key: 'name', width: 200 },
    { title: '状态', key: 'status', width: 80,
      render: (row) => h(NTag, { type: row.status === 1 ? 'success' : 'default' },
        row.status === 1 ? '启用' : '停用'),
    },
    { title: '操作', key: 'actions', width: 200,
      render: (row) => h(NSpace, null, [
        h(NButton, { size: 'small', type: 'primary', onClick: () => onEdit(row) }, '编辑'),
        h(NPopconfirm, { onPositiveClick: () => onDelete(row.id) },
          { default: () => '确认删除？', trigger: () => h(NButton, { size: 'small', type: 'error' }, '删除') }),
      ]),
    },
  ];
}
```

---

## 五、开发路线图

```
第1周 (P0 — 3天)
├── 知识库管理 (5页)
│   ├── api/knowledge/index.ts   (KnowledgeController — 19API)
│   ├── api/knowledge/document.ts (DocumentController — 6API)
│   ├── views/knowledge/list.vue + form.vue
│   ├── views/knowledge/relation.vue
│   ├── views/knowledge/graph.vue
│   ├── views/knowledge/document/list.vue + form.vue
│   └── views/knowledge/index.vue
├── 对话调试 (1页)
│   └── views/agent/chat-config/index.vue (复用已有API)
└── DB菜单入库
    └── 600-605 菜单记录 + role_workspace_menu 关联

第2周 (P1 — 4天)
├── 教育-基础 (8页)
│   ├── api/education/subject.ts + textbook.ts + chapter.ts + course.ts
│   ├── views/education/subject/ + textbook/ + chapter/ + course/
├── 教育-考试 (4页)
│   ├── api/education/exam.ts + question.ts
│   ├── views/education/exam/ + question/
└── DB菜单入库
    └── 700-706 菜单记录 + role_workspace_menu 关联

第3周 (P2 — 4天)
├── 教育-计划/复习 (4页)
│   ├── api/education/plan.ts + review.ts
│   ├── views/education/plan/ + review/
├── 教育-学情/资源/错题 (5页)
│   ├── api/education/analytics.ts + resource.ts + wrong-question.ts
│   ├── views/education/analytics/ + resource/ + wrong-question/
└── DB菜单入库
    └── 707-711 菜单记录 + role_workspace_menu 关联

第4周 (P3 — 0.5天)
├── 文件管理 (1页)
│   ├── api/common/file.ts
│   └── views/file/list.vue
└── DB菜单入库
    └── 800 菜单记录 + role_workspace_menu 关联
```


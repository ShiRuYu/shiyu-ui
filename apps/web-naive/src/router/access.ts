import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { message } from '#/adapter/naive';
import { getAllMenusApi } from '#/features/iam';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

import { validateMenuContract } from './menu-contract';

const forbiddenComponent = () =>
  import('#/app/pages/core/fallback/forbidden.vue');

const pageMap: ComponentRecordType = {
  'feature:agent.admin': () =>
    import('#/features/agent/pages/admin/agent-list.vue'),
  'feature:agent.apps': () => import('#/features/agent/pages/apps.vue'),
  'feature:agent.execution': () =>
    import('#/features/agent/pages/workspace.vue'),
  'feature:agent.intents': () =>
    import('#/features/agent/pages/intent/list.vue'),
  'feature:conversation.chat': () =>
    import('#/features/conversation/pages/chat.vue'),
  'feature:conversation.prompts': () =>
    import('#/features/conversation/pages/prompts.vue'),
  'feature:education.analytics': () =>
    import('#/features/education/pages/analytics/report.vue'),
  'feature:education.learning': () =>
    import('#/features/education/pages/student/learning.vue'),
  'feature:education.practice': () =>
    import('#/features/education/pages/student/practice.vue'),
  'feature:education.tutor': () =>
    import('#/features/education/pages/tutor/teacher/index.vue'),
  'feature:governance.approvals': () =>
    import('#/features/governance/pages/observability/approvals/index.vue'),
  'feature:governance.observability': () =>
    import('#/features/governance/pages/observability/index.vue'),
  'feature:governance.quotas': () =>
    import('#/features/governance/pages/quotas.vue'),
  'feature:iam.auth-codes': () =>
    import('#/features/iam/pages/system/auth-code/index.vue'),
  'feature:iam.dictionaries': () =>
    import('#/features/iam/pages/system/dict/index.vue'),
  'feature:iam.files': () => import('#/features/iam/pages/file.vue'),
  'feature:iam.menus': () =>
    import('#/features/iam/pages/system/menu/index.vue'),
  'feature:iam.roles': () =>
    import('#/features/iam/pages/system/role/index.vue'),
  'feature:iam.tenants': () =>
    import('#/features/iam/pages/system/tenant/index.vue'),
  'feature:iam.users': () =>
    import('#/features/iam/pages/system/user/index.vue'),
  'feature:knowledge.documents': () =>
    import('#/features/knowledge/pages/knowledge/documents/index.vue'),
  'feature:knowledge.evaluations': () =>
    import('#/features/knowledge/pages/knowledge/evaluations/index.vue'),
  'feature:knowledge.graph': () =>
    import('#/features/knowledge/pages/knowledge/graph/index.vue'),
  'feature:knowledge.retrieval': () =>
    import('#/features/knowledge/pages/rag.vue'),
  'feature:knowledge.search': () =>
    import('#/features/knowledge/pages/knowledge/search/index.vue'),
  'feature:knowledge.spaces': () =>
    import('#/features/knowledge/pages/knowledge/spaces/index.vue'),
  'feature:model.models': () => import('#/features/model/pages/model/list.vue'),
  'feature:model.platforms': () =>
    import('#/features/model/pages/platform/list.vue'),
  'feature:tooling.plugins': () =>
    import('#/features/tooling/pages/plugin/index.vue'),
};

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading(`${$t('common.loadingMenu')}...`, {
        duration: 1.5,
      });
      const menus = await getAllMenusApi();
      validateMenuContract(menus, Object.keys(pageMap));
      return menus;
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };

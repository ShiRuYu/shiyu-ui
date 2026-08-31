import type { RouteRecordRaw } from 'vue-router';

import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
  RouteRecordStringComponent,
} from '@vben-core/typings';

import { mapTree } from '@vben-core/shared/utils';

/**
 * 判断路由是否在菜单中显示但访问时展示 403（让用户知悉功能并申请权限）
 */
function menuHasVisibleWithForbidden(route: RouteRecordRaw): boolean {
  return !!route.meta?.menuVisibleWithForbidden;
}

/**
 * 动态生成路由 - 后端方式
 * 对 meta.menuVisibleWithForbidden 为 true 的项直接替换为 403 组件，让用户知悉功能并申请权限。
 */
async function generateRoutesByBackend(
  options: GenerateMenuAndRoutesOptions,
): Promise<RouteRecordRaw[]> {
  const {
    fetchMenuListAsync,
    layoutMap = {},
    pageMap = {},
    forbiddenComponent,
  } = options;

  try {
    const menuRoutes = await fetchMenuListAsync?.();
    if (!menuRoutes) {
      return [];
    }

    const normalizePageMap: ComponentRecordType = {};

    for (const [key, value] of Object.entries(pageMap)) {
      // Keep semantic feature keys intact; they are not filesystem paths.
      normalizePageMap[key] = value;
      normalizePageMap[normalizeViewPath(key)] = value;
    }

    let routes = convertRoutes(menuRoutes, layoutMap, normalizePageMap);

    if (forbiddenComponent) {
      routes = mapTree(routes, (route) => {
        if (menuHasVisibleWithForbidden(route)) {
          route.component = forbiddenComponent;
        }
        return route;
      });
    }

    return routes;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

function convertRoutes(
  routes: RouteRecordStringComponent[],
  layoutMap: ComponentRecordType,
  pageMap: ComponentRecordType,
): RouteRecordRaw[] {
  return mapTree(routes, (node) => {
    const route = node as unknown as RouteRecordRaw;
    const { component, name } = node;

    if (!name) {
      console.error('route name is required', route);
    }

    // layout转换
    if (component && layoutMap[component]) {
      route.component = layoutMap[component];
      // 页面组件转换
    } else if (component) {
      // Feature Slice menus use semantic keys (for example
      // `feature:iam.files`) rather than filesystem view paths. Resolve the
      // key directly before applying the legacy path normalization below.
      if (pageMap[component]) {
        route.component = pageMap[component];
        return route;
      }
      const normalizePath = normalizeViewPath(component);
      const pageKey = normalizePath.endsWith('.vue')
        ? normalizePath
        : `${normalizePath}.vue`;
      if (pageMap[pageKey]) {
        route.component = pageMap[pageKey];
      } else {
        console.error(`route component is invalid: ${pageKey}`, route);
        route.component = pageMap['/_core/fallback/not-found.vue'];
      }
    }

    return route;
  });
}

function normalizeViewPath(path: string): string {
  // 去除相对路径前缀
  const normalizedPath = path.replace(/^(\.\/|\.\.\/)+/, '');

  // 确保路径以 '/' 开头
  const viewPath = normalizedPath.startsWith('/')
    ? normalizedPath
    : `/${normalizedPath}`;

  return viewPath;
}
export { generateRoutesByBackend };

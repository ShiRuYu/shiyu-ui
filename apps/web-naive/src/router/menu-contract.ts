import type { RouteRecordStringComponent } from '@vben/types';

const FEATURE_COMPONENT_PATTERN = /^feature:[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

function normalizeComponentKey(component: string): string {
  if (!FEATURE_COMPONENT_PATTERN.test(component)) {
    throw new TypeError(
      `Menu component must use a semantic feature key: ${component}`,
    );
  }
  return component;
}

function validateMenuContract(
  menus: RouteRecordStringComponent[],
  availablePageKeys: string[],
): void {
  if (!Array.isArray(menus)) {
    throw new TypeError('Menu response must be an array');
  }
  const pageKeys = new Set(availablePageKeys);
  const routeNames = new Set<string>();

  const visit = (route: RouteRecordStringComponent, ancestry: string[]) => {
    if (!route || typeof route !== 'object') {
      throw new TypeError(`Invalid menu node below ${ancestry.join(' > ')}`);
    }
    if (typeof route.name !== 'string' || route.name.trim() === '') {
      throw new TypeError(`Menu node ${route.path || '(unknown)'} has no name`);
    }
    if (routeNames.has(route.name)) {
      throw new TypeError(`Duplicate menu route name: ${route.name}`);
    }
    routeNames.add(route.name);
    if (typeof route.path !== 'string' || route.path.trim() === '') {
      throw new TypeError(`Menu route ${route.name} has no path`);
    }

    if (route.component && typeof route.component === 'string') {
      const component = route.component;
      if (component !== 'BasicLayout' && component !== 'IFrameView') {
        const key = normalizeComponentKey(component);
        if (!pageKeys.has(key)) {
          throw new TypeError(
            `Menu route ${route.name} references missing component ${component}`,
          );
        }
      }
    }

    if (route.children !== undefined && !Array.isArray(route.children)) {
      throw new TypeError(`Menu route ${route.name} children must be an array`);
    }
    route.children?.forEach((child) =>
      visit(child, [...ancestry, String(route.name)]),
    );
  };

  menus.forEach((route) => visit(route, []));
}

export { normalizeComponentKey, validateMenuContract };

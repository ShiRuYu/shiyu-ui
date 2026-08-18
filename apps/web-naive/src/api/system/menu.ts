import type { Recordable } from '@vben/types';

import { requestClient } from '#/api/request';

export namespace SystemMenuApi {
  /** 徽标颜色集合 */
  export const BadgeVariants = [
    'default',
    'destructive',
    'primary',
    'success',
    'warning',
  ] as const;
  /** 徽标类型集合 */
  export const BadgeTypes = ['dot', 'normal'] as const;
  /** 菜单类型集合 */
  export const MenuTypes = ['catalog', 'menu', 'embedded', 'link'] as const;
  /** 系统菜单 */
  export interface SystemMenu {
    [key: string]: any;
    /** 菜单编码 */
    code?: string;
    /** 子级 */
    children?: SystemMenu[];
    /** 组件 */
    component?: string;
    /** 描述 */
    description?: string;
    /** 菜单ID */
    id: number;
    /** 布局 */
    layout?: string;
    /** 请求方法 */
    method?: string;
    /** 菜单元数据 */
    meta?: {
      /** 激活时显示的图标 */
      activeIcon?: string;
      /** 作为路由时,需要激活的菜单的Path */
      activePath?: string;
      /** 固定在标签栏 */
      affixTab?: boolean;
      /** 在标签栏固定的顺序 */
      affixTabOrder?: number;
      /** 徽标内容(当徽标类型为normal时有效) */
      badge?: string;
      /** 徽标类型 */
      badgeType?: (typeof BadgeTypes)[number];
      /** 徽标颜色 */
      badgeVariants?: (typeof BadgeVariants)[number];
      /** 在菜单中隐藏下级 */
      hideChildrenInMenu?: boolean;
      /** 在面包屑中隐藏 */
      hideInBreadcrumb?: boolean;
      /** 在菜单中隐藏 */
      hideInMenu?: boolean;
      /** 在标签栏中隐藏 */
      hideInTab?: boolean;
      /** 菜单图标 */
      icon?: string;
      /** 内嵌Iframe的URL */
      iframeSrc?: string;
      /** 是否缓存页面 */
      keepAlive?: boolean;
      /** 外链页面的URL */
      link?: string;
      /** 同一个路由最大打开的标签数 */
      maxNumOfOpenTab?: number;
      /** 无需基础布局 */
      noBasicLayout?: boolean;
      /** 是否在新窗口打开 */
      openInNewWindow?: boolean;
      /** 菜单排序 */
      order?: number;
      /** 额外的路由参数 */
      query?: Recordable<any>;
      /** 菜单标题 */
      title?: string;
    };
    /** 菜单名称 */
    name: string;
    /** 排序 */
    order?: number;
    /** 路由路径 */
    path: string;
    /** 父级ID */
    pid?: number;
    /** 重定向 */
    redirect?: string;
    /** 是否显示 */
    show?: boolean;
    /** 菜单状态 */
    status: number;
    /** 菜单类型 */
    type: (typeof MenuTypes)[number];
  }
}

/**
 * 获取根节点菜单（懒加载初始加载）
 */
async function getMenuRoots() {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>(
    '/v1/system/menus/roots',
  );
}

/**
 * 获取指定父菜单的子菜单（懒加载展开）
 * @param parentId 父菜单 ID
 */
async function getMenuChildren(parentId: number) {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>(
    '/v1/system/menus/children',
    {
      params: { parentId },
    },
  );
}

/**
 * 获取菜单数据列表
 */
async function getMenuList() {
  const data = await requestClient.get<Array<Recordable<any>>>(
    '/v1/system/menus/list',
  );
  const normalize = (item: Recordable<any>): SystemMenuApi.SystemMenu => ({
    ...item,
    id: Number(item.id),
    name: String(item.name ?? ''),
    path: String(item.path ?? ''),
    status: Number(item.status ?? 0),
    type: String(
      item.type || 'MENU',
    ).toLowerCase() as SystemMenuApi.SystemMenu['type'],
    meta: {
      icon: item.icon,
      keepAlive: item.keepAlive,
      order: item.order,
      title: item.name,
    },
    children: Array.isArray(item.children)
      ? item.children.map((child) => normalize(child))
      : undefined,
  });
  return Array.isArray(data) ? data.map((item) => normalize(item)) : [];
}

/**
 * 获取菜单数据列表（包装为 vxe-table 格式）
 */
function filterMenuTree(
  nodes: SystemMenuApi.SystemMenu[],
  params?: Recordable<any>,
): SystemMenuApi.SystemMenu[] {
  const name = String(params?.name ?? '')
    .trim()
    .toLowerCase();
  const code = String(params?.code ?? '')
    .trim()
    .toLowerCase();
  const type = String(params?.type ?? '')
    .trim()
    .toLowerCase();
  if (!name && !code && !type) return nodes;

  return nodes.flatMap((node) => {
    const children = filterMenuTree(node.children ?? [], params);
    const matches =
      (!name || node.name.toLowerCase().includes(name)) &&
      (!code ||
        String(node.code ?? '')
          .toLowerCase()
          .includes(code)) &&
      (!type || node.type === type);
    return matches || children.length > 0 ? [{ ...node, children }] : [];
  });
}

function countMenuTree(nodes: SystemMenuApi.SystemMenu[]): number {
  return nodes.reduce(
    (total, node) => total + 1 + countMenuTree(node.children ?? []),
    0,
  );
}

async function getMenuListForGrid(params?: Recordable<any>) {
  const data = await getMenuList();
  const list = Array.isArray(data) ? data : [];
  return {
    items: filterMenuTree(list, params),
    total: countMenuTree(list),
  };
}

async function getMenuPage(params?: Recordable<any>) {
  const data = await requestClient.get<{
    items: Recordable<any>[];
    total: number;
  }>('/v1/system/menus/page', { params });
  const normalize = (item: Recordable<any>): SystemMenuApi.SystemMenu => ({
    ...item,
    id: Number(item.id),
    name: String(item.name ?? ''),
    path: String(item.path ?? ''),
    status: Number(item.status ?? 0),
    type: String(
      item.type || 'MENU',
    ).toLowerCase() as SystemMenuApi.SystemMenu['type'],
    meta: {
      icon: item.icon,
      keepAlive: item.keepAlive,
      order: item.order,
      title: item.name,
    },
  });
  return {
    items: (data.items ?? []).map((item) => normalize(item)),
    total: data.total ?? 0,
  };
}

/**
 * 创建菜单
 * @param data 菜单数据
 */
async function createMenu(
  data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>,
) {
  return requestClient.post('/v1/system/menus/create', toMenuRequest(data));
}

/**
 * 更新菜单
 *
 * @param id 菜单 ID
 * @param data 菜单数据
 */
async function updateMenu(
  id: number,
  data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>,
) {
  return requestClient.post('/v1/system/menus/update', toMenuRequest(data), {
    params: { id },
  });
}

function toMenuRequest(data: Recordable<any>) {
  return {
    ...data,
    icon: data.meta?.icon ?? data.icon,
    keepAlive: data.meta?.keepAlive ?? data.keepAlive,
    name: data.meta?.title || data.name,
    type: String(data.type || 'MENU').toUpperCase(),
    meta: undefined,
  };
}

/**
 * 删除菜单
 * @param id 菜单 ID
 */
async function deleteMenu(id: number) {
  return requestClient.post('/v1/system/menus/delete', null, {
    params: { id },
  });
}

export {
  createMenu,
  deleteMenu,
  getMenuChildren,
  getMenuList,
  getMenuListForGrid,
  getMenuPage,
  getMenuRoots,
  updateMenu,
};

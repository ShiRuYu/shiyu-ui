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
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>('/menu/roots');
}

/**
 * 获取指定父菜单的子菜单（懒加载展开）
 * @param parentId 父菜单 ID
 */
async function getMenuChildren(parentId: number) {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>('/menu/children', {
    params: { parentId },
  });
}

/**
 * 获取菜单数据列表
 */
async function getMenuList() {
  const data = await requestClient.get<Array<Recordable<any>>>('/menu/list');
  const normalize = (item: Recordable<any>): SystemMenuApi.SystemMenu => ({
    ...item,
    id: Number(item.id),
    name: String(item.name ?? ''),
    path: String(item.path ?? ''),
    status: Number(item.status ?? 0),
    type: String(item.type || 'MENU').toLowerCase() as SystemMenuApi.SystemMenu['type'],
    meta: {
      icon: item.icon,
      keepAlive: item.keepAlive,
      order: item.order,
      title: item.name,
    },
    children: Array.isArray(item.children)
      ? item.children.map(normalize)
      : undefined,
  });
  return Array.isArray(data) ? data.map(normalize) : [];
}

/**
 * 获取菜单数据列表（包装为 vxe-table 格式）
 */
async function getMenuListForGrid() {
  const data = await getMenuList();
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

async function getMenuPage(params?: Recordable<any>) {
  const data = await requestClient.get<{
    items: Recordable<any>[];
    total: number;
  }>('/menu/page', { params });
  const normalize = (item: Recordable<any>): SystemMenuApi.SystemMenu => ({
    ...item,
    id: Number(item.id),
    name: String(item.name ?? ''),
    path: String(item.path ?? ''),
    status: Number(item.status ?? 0),
    type: String(item.type || 'MENU').toLowerCase() as SystemMenuApi.SystemMenu['type'],
    meta: {
      icon: item.icon,
      keepAlive: item.keepAlive,
      order: item.order,
      title: item.name,
    },
  });
  return {
    items: (data.items ?? []).map(normalize),
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
  return requestClient.post('/menu/create', toMenuRequest(data));
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
  return requestClient.post('/menu/update', toMenuRequest(data), {
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
  return requestClient.post('/menu/delete', null, { params: { id } });
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

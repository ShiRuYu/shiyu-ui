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
  export const MenuTypes = [
    'catalog',
    'menu',
    'embedded',
    'link',
    'button',
  ] as const;
  /** 系统菜单 */
  export interface SystemMenu {
    [key: string]: any;
    /** 后端权限标识 */
    authCode: string;
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
    status: string;
    /** 菜单类型 */
    type: (typeof MenuTypes)[number];
  }
}

/**
 * 获取根节点菜单（懒加载初始加载）
 */
async function getMenuRoots() {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>(
    '/admin/menu/list/roots',
  );
}

/**
 * 获取指定父菜单的子菜单（懒加载展开）
 * @param parentId 父菜单 ID
 */
async function getMenuChildren(parentId: number) {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>(
    '/admin/menu/list/children/' + parentId,
  );
}

/**
 * 获取菜单数据列表
 */
async function getMenuList() {
  return requestClient.get<Array<SystemMenuApi.SystemMenu>>('/admin/menu/list');
}

/**
 * 获取菜单数据列表（包装为 vxe-table 格式）
 */
async function getMenuListForGrid() {
  const data =
    await requestClient.get<Array<SystemMenuApi.SystemMenu>>(
      '/admin/menu/list',
    );
  const list = Array.isArray(data) ? data : [];
  return { items: list, total: list.length };
}

/**
 * 创建菜单
 * @param data 菜单数据
 */
async function createMenu(
  data: Omit<SystemMenuApi.SystemMenu, 'children' | 'id'>,
) {
  return requestClient.post('/admin/menu', data);
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
  return requestClient.patch(`/admin/menu/${id}`, data);
}

/**
 * 删除菜单
 * @param id 菜单 ID
 */
async function deleteMenu(id: number) {
  return requestClient.delete(`/admin/menu/${id}`);
}

export {
  createMenu,
  deleteMenu,
  getMenuChildren,
  getMenuList,
  getMenuListForGrid,
  getMenuRoots,
  updateMenu,
};

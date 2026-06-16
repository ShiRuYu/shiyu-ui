import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;
  /**
   * 头像
   */
  avatar: string;
  /**
   * 扩展信息
   */
  extInfo?: Record<string, any>;
  /**
   * 用户昵称
   */
  realName: string;
  /**
   * 用户角色
   */
  roles?: string[];
  /**
   * 用户id
   */
  userId: string;
  /**
   * 用户名
   */
  username: string;
}

interface TenantInfo {
  code?: string;
  id: number;
  name: string;
}

interface WorkspaceContextInfo {
  roleCode: string;
  workspaceId: number;
  workspaceName: string;
}

interface AccessState {
  /**
   * 当前租户ID
   */
  currentTenantId: null | number;
  /**
   * 当前租户名称
   */
  currentTenantName: string;
  /**
   * 当前工作空间ID
   */
  currentWorkspaceId: null | number;
  /**
   * 当前工作空间名称
   */
  currentWorkspaceName: string;
  /**
   * 可用租户列表
   */
  tenants: TenantInfo[];
  /**
   * 用户信息
   */
  userInfo: BasicUserInfo | null;
  /**
   * 用户角色
   */
  userRoles: string[];
  /**
   * 可用工作空间列表
   */
  workspaces: WorkspaceContextInfo[];
}

/**
 * @zh_CN 用户信息相关
 */
export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null) {
      // 设置用户信息
      if (userInfo && !userInfo.userId) {
        userInfo = { ...userInfo, userId: String((userInfo as any).id ?? '') };
      }
      this.userInfo = userInfo;
      // 设置角色信息
      const roles = userInfo?.roles ?? [];
      this.setUserRoles(roles);
      // 从 userInfo 中提取租户和工作空间信息
      if (userInfo) {
        const info = userInfo as any;
        if (Array.isArray(info.tenants)) {
          this.setTenants(info.tenants);
        }
        if (Array.isArray(info.workspaces)) {
          this.setWorkspaces(info.workspaces);
        }
        if (info.currentTenantId != null) {
          this.currentTenantId = info.currentTenantId;
        }
        if (info.currentWorkspaceId != null) {
          this.currentWorkspaceId = info.currentWorkspaceId;
          if (Array.isArray(info.workspaces)) {
            const ws = info.workspaces.find(
              (w: any) => w.workspaceId === info.currentWorkspaceId,
            );
            if (ws) {
              this.currentWorkspaceName = ws.workspaceName ?? '';
            }
          }
        }
        // 尝试从 tenants 列表中匹配当前租户名称
        if (info.currentTenantId != null && Array.isArray(info.tenants)) {
          const t = info.tenants.find(
            (t: any) => t.id === info.currentTenantId,
          );
          if (t) {
            this.currentTenantName = t.name ?? '';
          }
        }
      }
    },
    setUserRoles(roles: string[]) {
      this.userRoles = roles;
    },
    setTenants(tenants: TenantInfo[]) {
      this.tenants = tenants;
    },
    setCurrentTenant(tenantId: null | number, tenantName: string) {
      this.currentTenantId = tenantId;
      this.currentTenantName = tenantName;
    },
    setWorkspaces(workspaces: WorkspaceContextInfo[]) {
      this.workspaces = workspaces;
    },
    setCurrentWorkspace(workspaceId: null | number, workspaceName: string) {
      this.currentWorkspaceId = workspaceId;
      this.currentWorkspaceName = workspaceName;
    },
  },
  state: (): AccessState => ({
    userInfo: null,
    userRoles: [],
    tenants: [],
    currentTenantId: null,
    currentTenantName: '',
    workspaces: [],
    currentWorkspaceId: null,
    currentWorkspaceName: '',
  }),
});

// 解决热更新问题
const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}

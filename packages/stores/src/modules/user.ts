import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;
  avatar: string;
  currentTenantId?: number;
  extInfo?: Record<string, any>;
  homeTenantId?: number;
  realName: string;
  roles?: string[];
  switchMode?: string;
  userId: string;
  username: string;
}

interface TenantInfo {
  code?: string;
  id: number;
  name: string;
  pathName?: string;
}

interface AccessState {
  currentTenantId: null | number;
  currentTenantName: string;
  homeTenantId: null | number;
  tenants: TenantInfo[];
  userInfo: BasicUserInfo | null;
  userRoles: string[];
}

export const useUserStore = defineStore('core-user', {
  actions: {
    setUserInfo(userInfo: BasicUserInfo | null) {
      if (userInfo && !userInfo.userId) {
        userInfo = { ...userInfo, userId: String((userInfo as any).id ?? '') };
      }
      this.userInfo = userInfo;
      this.setUserRoles(userInfo?.roles ?? []);

      if (!userInfo) return;

      const info = userInfo as any;
      if (Array.isArray(info.tenants)) this.setTenants(info.tenants);
      if (info.currentTenantId != null) {
        this.currentTenantId = info.currentTenantId;
      }
      if (info.homeTenantId != null) {
        this.homeTenantId = info.homeTenantId;
      }
      if (info.currentTenantId != null && Array.isArray(info.tenants)) {
        const tenant = info.tenants.find(
          (item: TenantInfo) => item.id === info.currentTenantId,
        );
        if (tenant) this.currentTenantName = tenant.name;
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
    setHomeTenant(tenantId: null | number) {
      this.homeTenantId = tenantId;
    },
  },
  state: (): AccessState => ({
    userInfo: null,
    userRoles: [],
    tenants: [],
    homeTenantId: null,
    currentTenantId: null,
    currentTenantName: '',
  }),
});

const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}

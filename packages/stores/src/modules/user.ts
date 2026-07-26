import { acceptHMRUpdate, defineStore } from 'pinia';

interface BasicUserInfo {
  [key: string]: any;
  avatar: string;
  extInfo?: Record<string, any>;
  realName: string;
  roles?: string[];
  userId: string;
  username: string;
}

interface TenantInfo {
  code?: string;
  id: number;
  name: string;
}

interface SubTenantContextInfo {
  roleCode: string;
  tenantId: number;
  tenantName: string;
}

interface AccessState {
  currentTenantId: null | number;
  currentTenantName: string;
  filterTenantId: null | number;
  subTenants: SubTenantContextInfo[];
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
      if (Array.isArray(info.subTenants)) this.setSubTenants(info.subTenants);
      if (info.currentTenantId != null) {
        this.currentTenantId = info.currentTenantId;
      }
      if (info.filterTenantId !== undefined) {
        this.filterTenantId = info.filterTenantId;
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
    setSubTenants(subTenants: SubTenantContextInfo[]) {
      this.subTenants = subTenants;
    },
    setFilterTenantId(filterTenantId: null | number) {
      this.filterTenantId = filterTenantId;
    },
  },
  state: (): AccessState => ({
    userInfo: null,
    userRoles: [],
    tenants: [],
    subTenants: [],
    currentTenantId: null,
    currentTenantName: '',
    filterTenantId: null,
  }),
});

const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useUserStore, hot));
}

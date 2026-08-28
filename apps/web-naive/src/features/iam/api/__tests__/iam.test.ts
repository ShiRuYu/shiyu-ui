import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  upload: vi.fn(),
  download: vi.fn(),
}));
vi.mock('#/shared/api/request', () => ({
  baseRequestClient: requestMock,
  requestClient: requestMock,
}));

import { getTimezone, setTimezone } from '../common/timezone';
import {
  getAccessCodesApi,
  getAllMenusApi,
  getTimezoneOptions,
  getUserInfoApi,
  getUserTenantsApi,
  loginApi,
  logoutApi,
  refreshTokenApi,
  switchCurrentRoleApi,
  switchTenantApi,
} from '../index';
import {
  createAuthCode,
  deleteAuthCode,
  getAuthCodeList,
  getAuthCodeOptions,
  getAuthCodePage,
  getRoleAuthCodes,
  replaceRoleAuthCodes,
  updateAuthCode,
} from '../system/auth-code';
import {
  batchDeleteDict,
  createDict,
  deleteDict,
  getDictByType,
  getDictPage,
  updateDict,
} from '../system/dict';
import {
  createMenu,
  deleteMenu,
  getMenuChildren,
  getMenuList,
  getMenuListForGrid,
  getMenuPage,
  getMenuRoots,
  updateMenu,
} from '../system/menu';
import {
  createRole,
  deleteRole,
  getAllRoles,
  getRoleDetail,
  getRoleList,
  replaceRoleMenus,
  updateRole,
} from '../system/role';
import {
  createTenant,
  deleteTenant,
  getTenantList,
  getTenantPage,
  getTenantTreeOptions,
  updateTenant,
} from '../system/tenant';
import {
  deleteFile,
  downloadFile,
  getFileList,
  getFileStorageConfig,
  uploadFile,
} from '../system/upload';
import {
  changePassword,
  createUser,
  deleteUser,
  getRolesForUserForm,
  getUserList,
  getUserOptions,
  getUserTenantAssignments,
  replaceUserTenantAssignments,
  resetUserPassword,
  updateUser,
} from '../system/user';

describe('iAM feature transport facades', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestMock.get.mockResolvedValue({});
    requestMock.post.mockResolvedValue({});
  });

  it('keeps authentication and menu requests on IAM endpoints', async () => {
    await loginApi({ username: 'ada', password: 'secret' });
    await switchTenantApi(7);
    await getUserInfoApi();
    await getAllMenusApi();
    await getTimezoneOptions();

    expect(requestMock.post).toHaveBeenNthCalledWith(1, '/api/iam/auth/login', {
      username: 'ada',
      password: 'secret',
    });
    expect(requestMock.post).toHaveBeenNthCalledWith(
      2,
      '/api/iam/auth/switch-tenant',
      { tenantId: 7 },
    );
    expect(requestMock.get).toHaveBeenNthCalledWith(1, '/api/iam/users/detail');
    expect(requestMock.get).toHaveBeenNthCalledWith(2, '/api/iam/menus/all');
    expect(requestMock.get).toHaveBeenNthCalledWith(
      3,
      '/api/iam/timezone/options',
    );
  });

  it('covers IAM administration facades and their normalization branches', async () => {
    requestMock.get.mockImplementation(async (url: string) => {
      if (url.endsWith('/menus/list'))
        return [
          {
            id: '1',
            name: 'Root',
            path: '/',
            type: 'MENU',
            status: 1,
            children: [
              { id: 2, name: 'Child', path: '/c', type: 'menu', status: 1 },
            ],
          },
        ];
      if (url.endsWith('/tenants/list'))
        return [
          { id: 1, parentId: null, code: 'root', name: 'Root', status: 1 },
          { id: 2, parentId: 1, code: 'child', name: 'Child', status: '1' },
        ];
      if (url.endsWith('/users/list'))
        return { items: [{ id: 1, username: 'ada', nickName: '' }], total: 1 };
      if (url.endsWith('/menus/page')) return { items: [], total: 0 };
      return [];
    });
    requestMock.upload.mockResolvedValue({ key: 'k', name: 'a.txt' });
    requestMock.download.mockResolvedValue(new Blob(['data']));
    await refreshTokenApi('token');
    await logoutApi();
    await getAccessCodesApi();
    await switchCurrentRoleApi(2);
    await getUserTenantsApi();
    await getTimezone();
    await setTimezone('Asia/Shanghai');
    await getAuthCodeList();
    await getAuthCodePage({ page: 1 });
    await createAuthCode({ code: 'x', name: 'X' });
    await updateAuthCode(1, { name: 'Y' });
    await deleteAuthCode(1);
    await getRoleAuthCodes(2, 3);
    await getAuthCodeOptions();
    await replaceRoleAuthCodes(2, 3, ['x']);
    await getDictPage({ page: 2, pageSize: 5, status: 1 });
    await getDictPage();
    await getDictByType('gender');
    await createDict({
      dictLabel: 'A',
      dictType: 'x',
      dictValue: '1',
      status: 1,
    });
    await updateDict(1, { remark: 'r' });
    await deleteDict(1);
    await batchDeleteDict([1, 2]);
    await getMenuRoots();
    await getMenuChildren(1);
    const menus = await getMenuList();
    expect(menus[0]?.children?.[0]?.id).toBe(2);
    await getMenuListForGrid();
    await getMenuListForGrid({ name: 'child' });
    await getMenuListForGrid({ name: 'missing' });
    await getMenuListForGrid({ code: 'root', type: 'menu' });
    requestMock.get.mockResolvedValueOnce({ invalid: true });
    await getMenuList();
    requestMock.get.mockResolvedValueOnce({});
    await getMenuPage();
    await createMenu({
      id: undefined as never,
      name: 'N',
      path: '/n',
      status: 1,
      type: 'menu',
    });
    await updateMenu(1, {
      id: undefined as never,
      name: 'N',
      path: '/n',
      status: 1,
      type: 'menu',
    });
    await deleteMenu(1);
    await getRoleList({});
    await getAllRoles('1', 2);
    await createRole({ name: 'R', status: 1 });
    await updateRole(1, { name: 'R', status: 1 });
    await replaceRoleMenus(1, 2, [3]);
    await deleteRole(1);
    await getRoleDetail(1, 2);
    const tenantResult = await getTenantList({ name: 'child' });
    expect(tenantResult.total).toBe(2);
    await getTenantList({ code: 'root', status: '1' });
    await getTenantPage();
    await getTenantTreeOptions();
    await createTenant({ parentId: null, code: 'n', name: 'N', status: 1 });
    await updateTenant(1, { parentId: null, code: 'n', name: 'N', status: 1 });
    await deleteTenant(1);
    requestMock.get.mockResolvedValueOnce([
      { id: 2, username: 'bob', nickName: 'Bob' },
    ]);
    await getUserList({});
    await getUserList({ page: 2, pageSize: 20 });
    await getRolesForUserForm(1);
    await createUser({ username: 'u', status: 1, tenantId: 1 });
    await updateUser(1, { username: 'u', status: 1, tenantId: 1 });
    await deleteUser(1);
    await resetUserPassword(1, 'new');
    await changePassword(1, 'old', 'new');
    requestMock.get.mockResolvedValueOnce([]);
    await getUserOptions();
    await getUserTenantAssignments(1);
    await replaceUserTenantAssignments(1, [{ tenantId: 1, roleId: 2 }]);
    const file = new File(['x'], 'a.txt', { type: 'text/plain' });
    const progress: number[] = [];
    await getFileStorageConfig();
    await getFileList();
    await uploadFile({
      file,
      onProgress: (p) => progress.push(p.percent),
      onSuccess: vi.fn(),
    });
    requestMock.upload.mockRejectedValueOnce('network');
    await expect(uploadFile({ file, onError: vi.fn() })).rejects.toThrow(
      'network',
    );
    requestMock.upload.mockRejectedValueOnce(new Error('boom'));
    await expect(uploadFile({ file })).rejects.toThrow('boom');
    await downloadFile({ key: 'k', name: 'a.txt' } as any);
    await deleteFile('k');
    expect(progress).toEqual([0, 100]);
  });
});

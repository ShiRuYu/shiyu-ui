import type { BasicUserInfo } from '@vben-core/typings';

/** 用户信息 */
interface UserInfo extends BasicUserInfo {
  /**
   * 用户描述
   */
  desc: string;
  /**
   * 首页地址
   */
  homePath: string;

  /**
   * accessToken
   */
  token: string;
}

/** 角色信息（后端 RoleVO） */
interface RoleInfo {
  id: number;
  name: string;
  code: string;
  [key: string]: any;
}

export type { RoleInfo, UserInfo };

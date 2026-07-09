import { requestClient } from '#/api/request';

/**
 * 获取系统支持的时区列表
 */
export async function getTimezoneOptionsApi() {
  return await requestClient.get<
    {
      label: string;
      value: string;
    }[]
  >('/system/timezone/getTimezoneOptions');
}
/**
 * 获取用户时区
 */
export async function getTimezoneApi(): Promise<null | string | undefined> {
  return requestClient.get<null | string | undefined>(
    '/system/timezone/getTimezone',
  );
}
/**
 * 设置用户时区
 * @param timezone 时区
 */
export async function setTimezoneApi(timezone: string): Promise<void> {
  return requestClient.post('/system/timezone/setTimezone', { timezone });
}

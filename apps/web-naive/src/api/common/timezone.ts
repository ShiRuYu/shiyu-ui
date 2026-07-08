import { requestClient } from '#/api/request';

export namespace TimezoneApi {
  export interface TimezoneOption {
    label: string;
    value: string;
  }
}

async function getTimezoneOptions() {
  return requestClient.get<TimezoneApi.TimezoneOption[]>(
    '/system/timezone/options',
  );
}

async function getTimezone() {
  return requestClient.get<string>('/system/timezone/current');
}

async function setTimezone(timezone: string) {
  return requestClient.post('/system/timezone/set', { timezone });
}

export { getTimezone, getTimezoneOptions, setTimezone };

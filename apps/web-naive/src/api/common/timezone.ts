import { requestClient } from '#/api/request';

export namespace TimezoneApi {
  export interface TimezoneOption {
    label: string;
    value: string;
  }
}

async function getTimezoneOptions() {
  return requestClient.get<TimezoneApi.TimezoneOption[]>(
    '/v1/system/timezone/options',
  );
}

async function getTimezone() {
  return requestClient.get<string>('/v1/system/timezone/current');
}

async function setTimezone(timezone: string) {
  return requestClient.post('/v1/system/timezone/set', { timezone });
}

export { getTimezone, getTimezoneOptions, setTimezone };

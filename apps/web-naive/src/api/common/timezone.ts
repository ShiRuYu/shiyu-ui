import { requestClient } from '#/api/request';

export namespace TimezoneApi {
  export interface TimezoneOption {
    label: string;
    value: string;
  }
}

async function getTimezoneOptions() {
  return requestClient.get<TimezoneApi.TimezoneOption[]>(
    '/timezone/getTimezoneOptions',
  );
}

async function getTimezone() {
  return requestClient.get<string>('/timezone/getTimezone');
}

async function setTimezone(timezone: string) {
  return requestClient.post('/timezone/setTimezone', { timezone });
}

export { getTimezone, getTimezoneOptions, setTimezone };

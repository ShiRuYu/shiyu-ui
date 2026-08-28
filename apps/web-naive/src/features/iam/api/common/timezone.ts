import { requestClient } from '#/shared/api/request';

export namespace TimezoneApi {
  export interface TimezoneOption {
    label: string;
    value: string;
  }
}

async function getTimezoneOptions() {
  return requestClient.get<TimezoneApi.TimezoneOption[]>(
    '/api/iam/timezone/options',
  );
}

async function getTimezone() {
  return requestClient.get<string>('/api/iam/timezone/current');
}

async function setTimezone(timezone: string) {
  return requestClient.post('/api/iam/timezone/set', { timezone });
}

export { getTimezone, getTimezoneOptions, setTimezone };

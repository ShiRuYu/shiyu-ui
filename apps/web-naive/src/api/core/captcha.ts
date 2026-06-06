import { baseRequestClient, requestClient } from '#/api/request';

export namespace CaptchaApi {
  export interface CaptchaVO {
    expireTime?: number;
    image: string;
    key: string;
  }

  export interface ValidateRequest {
    code: string;
    key: string;
  }

  export interface ValidateResult {
    message: string;
    success: boolean;
  }
}

/**
 * 获取验证码图片
 */
export async function getCaptcha() {
  return requestClient.get<CaptchaApi.CaptchaVO>('/auth/captcha');
}

/**
 * 校验验证码（无鉴权）
 */
export async function validateCaptcha(data: CaptchaApi.ValidateRequest) {
  return baseRequestClient.post<CaptchaApi.ValidateResult>(
    '/auth/captcha/validate',
    data,
  );
}

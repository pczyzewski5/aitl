import { createHmac, randomBytes } from 'node:crypto';

export const SESSION_TOKEN_BYTES = 32;
export const SESSION_TOKEN_ENCODING = 'base64url';
export const SESSION_HASH_ENCODING = 'hex';
export const HMAC_ALGORITHM = 'sha256';

export const HMAC_DOMAIN = {
  Session: 'session:',
  Throttle: 'throttle:',
} as const;

export type HmacDomain = (typeof HMAC_DOMAIN)[keyof typeof HMAC_DOMAIN];

export class SessionTokens {
  private readonly secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  generate(): string {
    return randomBytes(SESSION_TOKEN_BYTES).toString(SESSION_TOKEN_ENCODING);
  }

  hash(token: string, domain: HmacDomain = HMAC_DOMAIN.Session): string {
    return createHmac(HMAC_ALGORITHM, this.secret)
      .update(`${domain}${token}`)
      .digest(SESSION_HASH_ENCODING);
  }
}

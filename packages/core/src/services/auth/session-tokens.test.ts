import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { HMAC_DOMAIN, SESSION_TOKEN_BYTES, SessionTokens } from './session-tokens';

const randomSecret = (): string => randomBytes(SESSION_TOKEN_BYTES).toString('hex');

describe('SessionTokens', () => {
  it('generates tokens of at least 32 random bytes that differ on every call', () => {
    const sut = new SessionTokens(randomSecret());

    const first = sut.generate();
    const second = sut.generate();

    expect(Buffer.from(first, 'base64url')).toHaveLength(SESSION_TOKEN_BYTES);
    expect(first).not.toBe(second);
  });

  it('hashes a token deterministically without containing the token', () => {
    const sut = new SessionTokens(randomSecret());
    const token = sut.generate();

    const actual = sut.hash(token);

    expect(actual).toBe(sut.hash(token));
    expect(actual).toMatch(/^[0-9a-f]{64}$/);
    expect(actual).not.toContain(token);
  });

  it('hashes the same token differently for another secret', () => {
    const token = randomSecret();

    const first = new SessionTokens(randomSecret()).hash(token);
    const second = new SessionTokens(randomSecret()).hash(token);

    expect(first).not.toBe(second);
  });

  it('separates the hash domains of sessions and throttles', () => {
    const sut = new SessionTokens(randomSecret());
    const value = randomSecret();

    const session = sut.hash(value, HMAC_DOMAIN.Session);
    const throttle = sut.hash(value, HMAC_DOMAIN.Throttle);

    expect(session).not.toBe(throttle);
    expect(session).toBe(sut.hash(value));
  });
});

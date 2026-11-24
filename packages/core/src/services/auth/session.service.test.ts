import { randomBytes, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemorySessionRepository, InMemoryStore } from '../support/in-memory-repositories';
import {
  SESSION_ABSOLUTE_TTL_MS,
  SESSION_ABSOLUTE_TTL_SECONDS,
  SESSION_EXTEND_INTERVAL_MS,
  SESSION_IDLE_TTL_MS,
  SessionService,
} from './session.service';
import { SessionTokens } from './session-tokens';

const START = new Date('2026-01-01T00:00:00Z');
const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

describe('SessionService', () => {
  let store: InMemoryStore;
  let tokens: SessionTokens;
  let now: Date;
  let sut: SessionService;
  let userId: string;

  const advanceTo = (time: number): void => {
    now = new Date(time);
  };

  beforeEach(() => {
    store = new InMemoryStore();
    tokens = new SessionTokens(randomBytes(32).toString('hex'));
    now = START;
    sut = new SessionService(new InMemorySessionRepository(store), tokens, () => now);
    userId = randomUUID();
  });

  describe('start', () => {
    it('stores only the hash of the token with both deadlines', async () => {
      const expected = {
        userId,
        expiresAt: new Date(START.getTime() + SESSION_IDLE_TTL_MS),
        absoluteExpiresAt: new Date(START.getTime() + SESSION_ABSOLUTE_TTL_MS),
      };

      const actual = await sut.start(userId);

      expect(store.sessions).toHaveLength(1);
      expect(store.sessions[0]).toMatchObject({ ...expected, tokenHash: tokens.hash(actual.token) });
      expect(JSON.stringify(store.sessions)).not.toContain(actual.token);
    });

    it('removes expired sessions and keeps valid ones', async () => {
      const expired = await sut.start(userId);
      const valid = await sut.start(userId);
      advanceTo(START.getTime() + SESSION_IDLE_TTL_MS);
      store.sessions = store.sessions.map((session) =>
        session.tokenHash === tokens.hash(valid.token)
          ? { ...session, expiresAt: new Date(now.getTime() + DAY_MS) }
          : session,
      );

      const started = await sut.start(userId);

      const remaining = store.sessions.map((session) => session.tokenHash);
      expect(remaining).toContain(tokens.hash(valid.token));
      expect(remaining).toContain(tokens.hash(started.token));
      expect(remaining).not.toContain(tokens.hash(expired.token));
    });

    it('gives every session a different token', async () => {
      const first = await sut.start(userId);
      const second = await sut.start(userId);

      expect(first.token).not.toBe(second.token);
    });

    it('matches the cookie lifetime with the absolute limit', () => {
      expect(SESSION_ABSOLUTE_TTL_SECONDS * 1000).toBe(SESSION_ABSOLUTE_TTL_MS);
    });
  });

  describe('resolve', () => {
    it('returns the user of a valid session', async () => {
      const { token } = await sut.start(userId);

      const actual = await sut.resolve(token);

      expect(actual).toEqual({ userId });
    });

    it.each([
      { name: 'there is no token', token: null },
      { name: 'the token is unknown', token: 'unknown-token' },
    ])('returns null when $name', async ({ token }) => {
      await sut.start(userId);

      const actual = await sut.resolve(token);

      expect(actual).toBeNull();
    });

    it('returns null once the idle period has passed and just before it still resolves', async () => {
      const { token } = await sut.start(userId);
      advanceTo(START.getTime() + SESSION_IDLE_TTL_MS - 1);
      const justBefore = await sut.resolve(token);
      store.sessions = store.sessions.map((session) => ({
        ...session,
        expiresAt: new Date(START.getTime() + SESSION_IDLE_TTL_MS),
      }));
      advanceTo(START.getTime() + SESSION_IDLE_TTL_MS);

      const actual = await sut.resolve(token);

      expect(justBefore).toEqual({ userId });
      expect(actual).toBeNull();
    });

    it('returns null after the absolute limit even when the idle deadline is later', async () => {
      const { token } = await sut.start(userId);
      advanceTo(START.getTime() + SESSION_ABSOLUTE_TTL_MS);
      store.sessions = store.sessions.map((session) => ({
        ...session,
        expiresAt: new Date(now.getTime() + DAY_MS),
      }));

      const actual = await sut.resolve(token);

      expect(actual).toBeNull();
    });

    it('slides the idle deadline when it moved by at least the extension interval', async () => {
      const { token } = await sut.start(userId);
      advanceTo(START.getTime() + SESSION_EXTEND_INTERVAL_MS);
      const expected = new Date(now.getTime() + SESSION_IDLE_TTL_MS);

      await sut.resolve(token);

      expect(store.sessions[0]?.expiresAt).toEqual(expected);
    });

    it('does not write again within the extension interval', async () => {
      const { token } = await sut.start(userId);
      const expected = store.sessions[0]?.expiresAt;
      advanceTo(START.getTime() + SESSION_EXTEND_INTERVAL_MS - MINUTE_MS);

      await sut.resolve(token);

      expect(store.sessions[0]?.expiresAt).toEqual(expected);
    });

    it('never slides the idle deadline past the absolute limit', async () => {
      const { token } = await sut.start(userId);
      advanceTo(START.getTime() + SESSION_ABSOLUTE_TTL_MS - DAY_MS);
      const expected = store.sessions[0]?.absoluteExpiresAt;
      store.sessions = store.sessions.map((session) => ({ ...session, expiresAt: new Date(now.getTime() + DAY_MS) }));

      await sut.resolve(token);

      expect(store.sessions[0]?.expiresAt).toEqual(expected);
    });
  });

  describe('end', () => {
    it('deletes the session so the old token no longer resolves', async () => {
      const { token } = await sut.start(userId);
      const other = await sut.start(userId);

      await sut.end(token);

      expect(await sut.resolve(token)).toBeNull();
      expect(await sut.resolve(other.token)).toEqual({ userId });
    });

    it('does nothing without a token or for an unknown token', async () => {
      const { token } = await sut.start(userId);

      await sut.end(null);
      await sut.end('unknown-token');

      expect(await sut.resolve(token)).toEqual({ userId });
    });
  });
});

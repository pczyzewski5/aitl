import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidCredentialsError } from '../../http/errors';
import {
  FakePasswordHasher,
  InMemorySessionRepository,
  InMemoryStore,
  InMemoryUserRepository,
} from '../support/in-memory-repositories';
import { AuthService, INVALID_CREDENTIALS_MESSAGE } from './auth.service';
import { SessionService } from './session.service';
import { SessionTokens } from './session-tokens';

const randomText = (): string => randomBytes(8).toString('hex');

describe('AuthService', () => {
  let store: InMemoryStore;
  let hasher: FakePasswordHasher;
  let sessionService: SessionService;
  let sut: AuthService;
  let email: string;
  let password: string;

  beforeEach(async () => {
    store = new InMemoryStore();
    hasher = new FakePasswordHasher();
    const users = new InMemoryUserRepository(store);
    sessionService = new SessionService(
      new InMemorySessionRepository(store),
      new SessionTokens(randomBytes(32).toString('hex')),
      () => new Date(),
    );
    sut = new AuthService(users, hasher, sessionService);
    email = `${randomText()}@example.test`;
    password = randomText();
    await users.create({ email, displayName: randomText(), passwordHash: await hasher.hash(password) });
  });

  describe('login', () => {
    it('returns the user without the hash and a token of a started session', async () => {
      const verify = vi.spyOn(hasher, 'verify');
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');

      const actual = await sut.login({ email, password });

      expect(actual.user).toEqual({ id: store.users[0]?.id, email, displayName: store.users[0]?.displayName });
      expect(await sessionService.resolve(actual.sessionToken)).toEqual({ userId: store.users[0]?.id });
      expect(verify).toHaveBeenCalledTimes(1);
      expect(decoy).not.toHaveBeenCalled();
    });

    it('rejects a wrong password with the shared error and starts no session', async () => {
      const verify = vi.spyOn(hasher, 'verify');
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');

      const actual = sut.login({ email, password: randomText() });

      await expect(actual).rejects.toThrow(new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE));
      expect(store.sessions).toHaveLength(0);
      expect(verify).toHaveBeenCalledTimes(1);
      expect(decoy).not.toHaveBeenCalled();
    });

    it('rejects an unknown e-mail with the same error after the same hashing work as a known one', async () => {
      const verify = vi.spyOn(hasher, 'verify');
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');
      const unknownPassword = randomText();

      const actual = sut.login({ email: `${randomText()}@example.test`, password: unknownPassword });

      await expect(actual).rejects.toThrow(new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE));
      expect(store.sessions).toHaveLength(0);
      expect(decoy).toHaveBeenCalledTimes(1);
      expect(decoy).toHaveBeenCalledWith(unknownPassword);
      expect(verify).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('deletes the session of the token', async () => {
      const { sessionToken } = await sut.login({ email, password });

      await sut.logout(sessionToken);

      expect(store.sessions).toHaveLength(0);
      expect(await sessionService.resolve(sessionToken)).toBeNull();
    });

    it('does nothing without a token', async () => {
      await sut.login({ email, password });

      await sut.logout(null);

      expect(store.sessions).toHaveLength(1);
    });
  });
});

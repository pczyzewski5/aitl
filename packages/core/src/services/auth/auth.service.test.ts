import { randomBytes } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvalidCredentialsError, TooManyRequestsError, UnauthorizedError } from '../../http/errors';
import {
  FakePasswordHasher,
  InMemoryLoginThrottleRepository,
  InMemorySessionRepository,
  InMemoryStore,
  InMemoryUserRepository,
} from '../support/in-memory-repositories';
import { AuthService, INVALID_CREDENTIALS_MESSAGE, UNAUTHENTICATED_USER_MESSAGE } from './auth.service';
import { LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL, LoginThrottleService } from './login-throttle.service';
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
  let clientIp: string;

  beforeEach(async () => {
    store = new InMemoryStore();
    hasher = new FakePasswordHasher();
    const users = new InMemoryUserRepository(store);
    const tokens = new SessionTokens(randomBytes(32).toString('hex'));
    sessionService = new SessionService(new InMemorySessionRepository(store), tokens, () => new Date());
    sut = new AuthService(
      users,
      hasher,
      sessionService,
      new LoginThrottleService(new InMemoryLoginThrottleRepository(store), tokens, () => new Date()),
    );
    clientIp = randomText();
    email = `${randomText()}@example.test`;
    password = randomText();
    await users.create({ email, displayName: randomText(), passwordHash: await hasher.hash(password) });
  });

  describe('login', () => {
    it('returns the user without the hash and a token of a started session', async () => {
      const verify = vi.spyOn(hasher, 'verify');
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');

      const actual = await sut.login({ email, password }, clientIp);

      expect(actual.user).toEqual({ id: store.users[0]?.id, email, displayName: store.users[0]?.displayName });
      expect(await sessionService.resolve(actual.sessionToken)).toEqual({ userId: store.users[0]?.id });
      expect(verify).toHaveBeenCalledTimes(1);
      expect(decoy).not.toHaveBeenCalled();
    });

    it('rejects a wrong password with the shared error and starts no session', async () => {
      const verify = vi.spyOn(hasher, 'verify');
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');

      const actual = sut.login({ email, password: randomText() }, clientIp);

      await expect(actual).rejects.toThrow(new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE));
      expect(store.sessions).toHaveLength(0);
      expect(verify).toHaveBeenCalledTimes(1);
      expect(decoy).not.toHaveBeenCalled();
    });

    it('rejects an unknown e-mail with the same error after the same hashing work as a known one', async () => {
      const verify = vi.spyOn(hasher, 'verify');
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');
      const unknownPassword = randomText();

      const actual = sut.login({ email: `${randomText()}@example.test`, password: unknownPassword }, clientIp);

      await expect(actual).rejects.toThrow(new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE));
      expect(store.sessions).toHaveLength(0);
      expect(decoy).toHaveBeenCalledTimes(1);
      expect(decoy).toHaveBeenCalledWith(unknownPassword);
      expect(verify).not.toHaveBeenCalled();
    });
  });

  describe('login throttling', () => {
    const failTimes = async (times: number, loginEmail = email): Promise<void> => {
      for (let attempt = 0; attempt < times; attempt += 1) {
        await sut.login({ email: loginEmail, password: randomText() }, clientIp).catch(() => undefined);
      }
    };

    it('rejects the correct password without verifying it once the limit of failures is reached', async () => {
      await failTimes(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL);
      const verify = vi.spyOn(hasher, 'verify');

      const actual = sut.login({ email, password }, clientIp);

      await expect(actual).rejects.toBeInstanceOf(TooManyRequestsError);
      expect(verify).not.toHaveBeenCalled();
      expect(store.sessions).toHaveLength(0);
    });

    it('locks an unknown e-mail the same way and without hashing work', async () => {
      const unknownEmail = `${randomText()}@example.test`;
      await failTimes(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL, unknownEmail);
      const decoy = vi.spyOn(hasher, 'verifyAgainstDecoy');

      const actual = sut.login({ email: unknownEmail, password: randomText() }, clientIp);

      await expect(actual).rejects.toBeInstanceOf(TooManyRequestsError);
      expect(decoy).not.toHaveBeenCalled();
    });

    it('clears the failures after a successful login', async () => {
      await failTimes(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);
      await sut.login({ email, password }, clientIp);

      await failTimes(LOGIN_FAILURE_LIMIT_PER_IP_AND_EMAIL - 1);

      await expect(sut.login({ email, password }, clientIp)).resolves.toBeDefined();
    });
  });

  describe('logout', () => {
    it('deletes the session of the token', async () => {
      const { sessionToken } = await sut.login({ email, password }, clientIp);

      await sut.logout(sessionToken);

      expect(store.sessions).toHaveLength(0);
      expect(await sessionService.resolve(sessionToken)).toBeNull();
    });

    it('does nothing without a token', async () => {
      await sut.login({ email, password }, clientIp);

      await sut.logout(null);

      expect(store.sessions).toHaveLength(1);
    });
  });

  describe('getCurrentUser', () => {
    it('returns the user without the hash', async () => {
      const { user } = await sut.login({ email, password }, clientIp);

      const actual = await sut.getCurrentUser(user.id);

      expect(actual).toEqual({ id: user.id, email, displayName: user.displayName });
    });

    it('rejects an id of no user as unauthenticated', async () => {
      const actual = sut.getCurrentUser(randomText());

      await expect(actual).rejects.toThrow(new UnauthorizedError(UNAUTHENTICATED_USER_MESSAGE));
    });
  });
});

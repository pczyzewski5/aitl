import type { Session, SessionResolver } from '../../http/auth';
import type { Clock } from './clock.port';
import type { SessionRepository } from './session-repository.port';
import type { SessionTokens } from './session-tokens';

export const MILLISECONDS_PER_SECOND = 1000;
export const SESSION_IDLE_TTL_MS = 30 * 24 * 60 * 60 * MILLISECONDS_PER_SECOND;
export const SESSION_ABSOLUTE_TTL_MS = 90 * 24 * 60 * 60 * MILLISECONDS_PER_SECOND;
export const SESSION_ABSOLUTE_TTL_SECONDS = SESSION_ABSOLUTE_TTL_MS / MILLISECONDS_PER_SECOND;
export const SESSION_EXTEND_INTERVAL_MS = 60 * 60 * MILLISECONDS_PER_SECOND;

export type StartedSession = Readonly<{ token: string }>;

export class SessionService implements SessionResolver {
  private readonly sessions: SessionRepository;
  private readonly tokens: SessionTokens;
  private readonly clock: Clock;

  constructor(sessions: SessionRepository, tokens: SessionTokens, clock: Clock) {
    this.sessions = sessions;
    this.tokens = tokens;
    this.clock = clock;
  }

  async start(userId: string): Promise<StartedSession> {
    const now = this.clock();
    const token = this.tokens.generate();

    await this.sessions.deleteExpired(now);
    await this.sessions.create({
      userId,
      tokenHash: this.tokens.hash(token),
      expiresAt: new Date(now.getTime() + SESSION_IDLE_TTL_MS),
      absoluteExpiresAt: new Date(now.getTime() + SESSION_ABSOLUTE_TTL_MS),
    });

    return { token };
  }

  async resolve(token: string | null): Promise<Session | null> {
    if (token === null) {
      return null;
    }

    const record = await this.sessions.findByTokenHash(this.tokens.hash(token));
    const now = this.clock();

    if (record === null || now >= record.expiresAt || now >= record.absoluteExpiresAt) {
      return null;
    }

    await this.extendWhenDue(record.id, record.expiresAt, record.absoluteExpiresAt, now);

    return { userId: record.userId };
  }

  async end(token: string | null): Promise<void> {
    if (token === null) {
      return;
    }

    await this.sessions.deleteByTokenHash(this.tokens.hash(token));
  }

  private async extendWhenDue(
    id: string,
    expiresAt: Date,
    absoluteExpiresAt: Date,
    now: Date,
  ): Promise<void> {
    const extendedTime = Math.min(now.getTime() + SESSION_IDLE_TTL_MS, absoluteExpiresAt.getTime());

    if (extendedTime - expiresAt.getTime() >= SESSION_EXTEND_INTERVAL_MS) {
      await this.sessions.updateExpiresAt(id, new Date(extendedTime));
    }
  }
}

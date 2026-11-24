import type { NewSession, SessionRecord, SessionRepository } from '@aitl/core';
import { Session } from '../../entities/auth/session.entity';
import type { EntityManagerProvider } from '../../orm-provider';

type SessionRow = Readonly<{
  id: string;
  user: Readonly<{ id: string }>;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}>;

function toRecord({ id, user, expiresAt, absoluteExpiresAt }: SessionRow): SessionRecord {
  return { id, userId: user.id, expiresAt, absoluteExpiresAt };
}

export class MikroOrmSessionRepository implements SessionRepository {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async create({ userId, tokenHash, expiresAt, absoluteExpiresAt }: NewSession): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    em.create(Session, { user: userId, tokenHash, expiresAt, absoluteExpiresAt });
    await em.flush();
  }

  async findByTokenHash(tokenHash: string): Promise<SessionRecord | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const session = await em.findOne(Session, { tokenHash });

    return session === null ? null : toRecord(session);
  }

  async updateExpiresAt(id: string, expiresAt: Date): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    await em.nativeUpdate(Session, { id }, { expiresAt });
  }

  async deleteByTokenHash(tokenHash: string): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    await em.nativeDelete(Session, { tokenHash });
  }

  async deleteExpired(now: Date): Promise<void> {
    const em = await this.entityManagerProvider.getEntityManager();
    await em.nativeDelete(Session, {
      $or: [{ expiresAt: { $lte: now } }, { absoluteExpiresAt: { $lte: now } }],
    });
  }
}

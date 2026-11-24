export type SessionRecord = Readonly<{
  id: string;
  userId: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}>;

export type NewSession = Readonly<{
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  absoluteExpiresAt: Date;
}>;

export interface SessionRepository {
  create(session: NewSession): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  updateExpiresAt(id: string, expiresAt: Date): Promise<void>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteExpired(now: Date): Promise<void>;
}

import type { NewUser, UserRecord, UserRepository } from '@aitl/core';
import { User } from '../../entities/users/user.entity';
import type { EntityManagerProvider } from '../../orm-provider';

type UserRow = Readonly<{ id: string; email: string; displayName: string; passwordHash: string }>;

function toRecord({ id, email, displayName, passwordHash }: UserRow): UserRecord {
  return { id, email, displayName, passwordHash };
}

export class MikroOrmUserRepository implements UserRepository {
  private readonly entityManagerProvider: EntityManagerProvider;

  constructor(entityManagerProvider: EntityManagerProvider) {
    this.entityManagerProvider = entityManagerProvider;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const user = await em.findOne(User, { email });

    return user === null ? null : toRecord(user);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const em = await this.entityManagerProvider.getEntityManager();
    const user = await em.findOne(User, { id });

    return user === null ? null : toRecord(user);
  }

  async create(newUser: NewUser): Promise<UserRecord> {
    const em = await this.entityManagerProvider.getEntityManager();
    const user = em.create(User, newUser);
    await em.flush();

    return toRecord(user);
  }
}

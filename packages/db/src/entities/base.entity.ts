import { p } from '@mikro-orm/postgresql';

export const baseEntityProperties = {
  id: p.uuid().primary().onCreate(() => crypto.randomUUID()),
  createdAt: p.datetime().onCreate(() => new Date()),
  updatedAt: p
    .datetime()
    .onCreate(() => new Date())
    .onUpdate(() => new Date()),
};

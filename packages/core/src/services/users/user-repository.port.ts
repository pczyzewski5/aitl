export type UserRecord = Readonly<{
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
}>;

export type NewUser = Readonly<{
  email: string;
  displayName: string;
  passwordHash: string;
}>;

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(user: NewUser): Promise<UserRecord>;
}

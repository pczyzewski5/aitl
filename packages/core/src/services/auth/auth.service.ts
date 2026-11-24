import { InvalidCredentialsError } from '../../http/errors';
import type { LoginInput } from '../../validators/auth/login.schema';
import type { ProvisionedUser } from '../users/user-provisioning.service';
import type { UserRepository } from '../users/user-repository.port';
import type { PasswordHasher } from './password-hasher.port';
import type { SessionService } from './session.service';

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

export type LoginResult = Readonly<{
  user: ProvisionedUser;
  sessionToken: string;
}>;

export class AuthService {
  private readonly users: UserRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly sessionService: SessionService;

  constructor(
    users: UserRepository,
    passwordHasher: PasswordHasher,
    sessionService: SessionService,
  ) {
    this.users = users;
    this.passwordHasher = passwordHasher;
    this.sessionService = sessionService;
  }

  async login({ email, password }: LoginInput): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);

    if (user === null) {
      await this.passwordHasher.verifyAgainstDecoy(password);

      throw new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!(await this.passwordHasher.verify(password, user.passwordHash))) {
      throw new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE);
    }

    const { token } = await this.sessionService.start(user.id);

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      sessionToken: token,
    };
  }

  logout(sessionToken: string | null): Promise<void> {
    return this.sessionService.end(sessionToken);
  }
}

import { InvalidCredentialsError, UnauthorizedError } from '../../http/errors';
import type { LoginInput } from '../../validators/auth/login.schema';
import type { ProvisionedUser } from '../users/user-provisioning.service';
import type { UserRepository } from '../users/user-repository.port';
import type { LoginAttemptIdentity, LoginThrottleService } from './login-throttle.service';
import type { PasswordHasher } from './password-hasher.port';
import type { SessionService } from './session.service';

export const INVALID_CREDENTIALS_MESSAGE = 'Invalid credentials';

export const UNAUTHENTICATED_USER_MESSAGE = 'Authentication required';

export type LoginResult = Readonly<{
  user: ProvisionedUser;
  sessionToken: string;
}>;

export class AuthService {
  private readonly users: UserRepository;
  private readonly passwordHasher: PasswordHasher;
  private readonly sessionService: SessionService;
  private readonly loginThrottle: LoginThrottleService;

  constructor(
    users: UserRepository,
    passwordHasher: PasswordHasher,
    sessionService: SessionService,
    loginThrottle: LoginThrottleService,
  ) {
    this.users = users;
    this.passwordHasher = passwordHasher;
    this.sessionService = sessionService;
    this.loginThrottle = loginThrottle;
  }

  async login({ email, password }: LoginInput, clientIp: string): Promise<LoginResult> {
    const identity: LoginAttemptIdentity = { email, clientIp };
    await this.loginThrottle.assertNotLocked(identity);

    const user = await this.users.findByEmail(email);

    if (user === null) {
      await this.passwordHasher.verifyAgainstDecoy(password);
      await this.loginThrottle.recordFailure(identity);

      throw new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!(await this.passwordHasher.verify(password, user.passwordHash))) {
      await this.loginThrottle.recordFailure(identity);

      throw new InvalidCredentialsError(INVALID_CREDENTIALS_MESSAGE);
    }

    await this.loginThrottle.reset(identity);
    const { token } = await this.sessionService.start(user.id);

    return {
      user: { id: user.id, email: user.email, displayName: user.displayName },
      sessionToken: token,
    };
  }

  async getCurrentUser(userId: string): Promise<ProvisionedUser> {
    const user = await this.users.findById(userId);

    if (user === null) {
      throw new UnauthorizedError(UNAUTHENTICATED_USER_MESSAGE);
    }

    return { id: user.id, email: user.email, displayName: user.displayName };
  }

  logout(sessionToken: string | null): Promise<void> {
    return this.sessionService.end(sessionToken);
  }
}

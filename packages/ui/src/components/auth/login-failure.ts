import { formatSeconds } from './format-seconds';
import type { LoginFormMessages } from './messages';

type LoginFailureKind = 'invalid-credentials' | 'too-many-attempts' | 'network' | 'server-error';

interface LoginFailure {
  ok: false;
  kind: LoginFailureKind;
  retryAfterSeconds?: number;
}

type LoginResult = { ok: true } | LoginFailure;

function describeLoginFailure(failure: LoginFailure, messages: LoginFormMessages): string {
  switch (failure.kind) {
    case 'invalid-credentials':
      return messages.invalidCredentials;
    case 'too-many-attempts': {
      const seconds = Math.ceil(failure.retryAfterSeconds ?? 0);

      return seconds > 0 ? messages.tooManyAttempts(formatSeconds(seconds)) : messages.tooManyAttemptsWithoutTime;
    }
    case 'network':
      return messages.network;
    case 'server-error':
      return messages.serverError;
  }
}

export { describeLoginFailure };
export type { LoginFailure, LoginFailureKind, LoginResult };

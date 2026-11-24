import { DEFAULT_ACCOUNT_OPTIONS, DEMO_USERS, accountsOf } from './fixtures';
import type { UserId } from './fixtures';
import type { IdProbeKind } from './store';

const OTHER_USERS_ACCOUNT_ID = 'a9';
const WIFE_FOREIGN_ACCOUNT_ID = 'a2';

export const ID_PROBE_LABELS: Record<IdProbeKind, string> = {
  own: 'Własne konto',
  foreign: 'Konto innego użytkownika',
  'no-session': 'Bez sesji',
};

// Wskaźnik tekstowy dla kryteriów API bez ekranu (S01-K6, S02-K3, Q28, P14): odmowa istnieje tylko w API.
export function probeAccountById(kind: IdProbeKind, sessionUserId: UserId | null): string {
  if (kind === 'no-session' || sessionUserId === null) {
    return 'GET /api/bank-accounts/{id} bez sesji: 401, zero danych konta (S01-K3, S02-K4).';
  }
  if (kind === 'own') {
    const own = accountsOf(DEMO_USERS[sessionUserId], DEFAULT_ACCOUNT_OPTIONS)[0];
    if (own === undefined) {
      return 'Ten użytkownik nie ma żadnego konta (brak członkostwa): nie ma własnego konta do zażądania.';
    }

    return `GET /api/bank-accounts/${own.id}: 200, własne konto "${own.name}" (S01-K6).`;
  }
  const foreignId = sessionUserId === 'zona' ? WIFE_FOREIGN_ACCOUNT_ID : OTHER_USERS_ACCOUNT_ID;

  return `GET /api/bank-accounts/${foreignId}: 403, konto innego użytkownika, zero danych (S01-K6, S02-K3, Q28). W UI E01 nie ma ekranu odmowy.`;
}

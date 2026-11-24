import { Alert, AlertDescription } from '@aitl/ui';
import { AccountListView } from '../account-list-view';
import { DEMO_USERS } from '../fixtures';
import type { UserId } from '../fixtures';
import { navigateTo } from '../navigation';
import { SessionShell } from '../session-shell';
import { logOut, signOutPairMember, useScenario } from '../store';

const ACCOUNT_SCREEN_HREF = '#s03';
const PAIR_FRAME_HREF = '#s02';
const PAIR_USER_IDS: readonly UserId[] = ['pawel', 'zona'];

function logOutAndRedirect(): void {
  logOut();
  navigateTo('s01');
}

function PairFrame({ userId }: { userId: UserId }) {
  const { signedOutPairMembers } = useScenario();
  const user = DEMO_USERS[userId];

  if (signedOutPairMembers.includes(userId)) {
    return (
      <div className="flex flex-col gap-(--space-within-group) rounded-card border border-border p-(--space-panel)">
        <p className="font-semibold">{user.displayName}: wylogowano w tej ramce</p>
        <p className="text-sm text-muted-foreground">Druga sesja działa dalej bez zmian: sesje są niezależne (S02-K5).</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 overflow-hidden rounded-card border border-border">
      <SessionShell displayName={user.displayName} onLogout={() => signOutPairMember(userId)}>
        <AccountListView userId={userId} accountHref={PAIR_FRAME_HREF} headingLevel="h2" rememberOpenedAccount={false} />
      </SessionShell>
    </div>
  );
}

function TwoSessionsView() {
  return (
    <div className="flex flex-col gap-(--space-between-groups) p-(--space-panel)">
      <Alert variant="neutral">
        <AlertDescription>
          Symulacja &bdquo;dwie sesje naraz&rdquo; (S02-K5): właściciel i żona są zalogowani jednocześnie, każda ramka ma własną listę i własne
          wylogowanie. W tym widoku linki kont nie otwierają ekranu konta; służy tylko do pokazania niezależności sesji.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 gap-(--space-between-groups) md:grid-cols-2">
        {PAIR_USER_IDS.map((userId) => (
          <PairFrame key={userId} userId={userId} />
        ))}
      </div>
    </div>
  );
}

function HomeScreen() {
  const { sessionUserId, twoSessions } = useScenario();

  if (twoSessions) {
    return <TwoSessionsView />;
  }

  if (sessionUserId === null) {
    return (
      <SessionShell displayName="" onLogout={logOutAndRedirect}>
        <p className="text-muted-foreground">Brak sesji: w aplikacji ten adres przekierowuje na s01 (logowanie).</p>
      </SessionShell>
    );
  }

  return (
    <SessionShell displayName={DEMO_USERS[sessionUserId].displayName} onLogout={logOutAndRedirect}>
      <AccountListView userId={sessionUserId} accountHref={ACCOUNT_SCREEN_HREF} headingLevel="h1" rememberOpenedAccount />
    </SessionShell>
  );
}

export { HomeScreen };

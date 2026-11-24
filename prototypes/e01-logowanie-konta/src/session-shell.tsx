import { DEFAULT_APP_SHELL_MESSAGES, cn } from '@aitl/ui';
import type { ReactNode } from 'react';

interface SessionShellProps {
  displayName: string;
  onLogout: () => void;
  children: ReactNode;
}

const CONTENT_WIDTH_CLASS = 'mx-auto w-full max-w-240';
const LOGOUT_BUTTON_CLASS =
  'inline-flex min-h-control items-center rounded-control text-primary-foreground underline underline-offset-2 hover:text-primary-foreground';

// LUKA DS (LDS1, LDS2): AppShell przyjmuje tylko logoutHref (zwykły link) i nie ma miejsca na displayName.
// Lokalny pasek odtwarza wygląd AppShell z tokenów; do zastąpienia, gdy DS dostanie wariant przycisku-linku i slot.
function SessionShell({ displayName, onLogout, children }: SessionShellProps) {
  return (
    <div data-slot="app-shell" className="flex flex-col bg-background text-foreground">
      <header className="bg-primary text-primary-foreground">
        <div className={cn(CONTENT_WIDTH_CLASS, 'flex items-center justify-between gap-(--space-within-group) p-(--space-panel)')}>
          <p className="min-w-0 text-xl font-semibold leading-base">{DEFAULT_APP_SHELL_MESSAGES.productName}</p>
          <div className="flex min-w-0 items-center gap-(--space-between-groups)">
            <p className="min-w-0 text-sm wrap-anywhere">{displayName}</p>
            <button type="button" className={LOGOUT_BUTTON_CLASS} onClick={onLogout}>
              {DEFAULT_APP_SHELL_MESSAGES.logoutLabel}
            </button>
          </div>
        </div>
      </header>
      <main className={cn(CONTENT_WIDTH_CLASS, 'flex-1 px-(--space-panel) py-(--space-section)')}>{children}</main>
    </div>
  );
}

export { SessionShell };

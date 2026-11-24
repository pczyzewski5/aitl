import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { DEFAULT_APP_SHELL_MESSAGES, type AppShellMessages } from './app-shell.messages';

interface AppShellProps extends Omit<ComponentProps<'div'>, 'children'> {
  children: ReactNode;
  displayName?: string;
  onLogout?: () => void;
  messages?: Partial<AppShellMessages>;
}

const CONTENT_WIDTH_CLASS = 'mx-auto w-full max-w-240';
const LOGOUT_BUTTON_CLASS =
  'inline-flex min-h-control items-center rounded-control text-primary-foreground underline underline-offset-2 hover:text-primary-foreground';

function AppShell({ children, displayName, onLogout, messages, className, ...props }: AppShellProps) {
  const text = { ...DEFAULT_APP_SHELL_MESSAGES, ...messages };

  return (
    <div data-slot="app-shell" className={cn('flex min-h-screen flex-col bg-background text-foreground', className)} {...props}>
      <header className="bg-primary text-primary-foreground">
        <div className={cn(CONTENT_WIDTH_CLASS, 'flex items-center justify-between gap-(--space-within-group) p-(--space-panel)')}>
          <p className="min-w-0 text-xl font-semibold leading-base">{text.productName}</p>
          {displayName === undefined && onLogout === undefined ? null : (
            <div className="flex min-w-0 items-center gap-(--space-between-groups)">
              {displayName === undefined ? null : (
                <p data-slot="app-shell-user" className="min-w-0 text-sm wrap-anywhere">
                  {displayName}
                </p>
              )}
              {onLogout === undefined ? null : (
                <button type="button" data-slot="app-shell-logout" className={LOGOUT_BUTTON_CLASS} onClick={onLogout}>
                  {text.logoutLabel}
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      <main className={cn(CONTENT_WIDTH_CLASS, 'flex-1 px-(--space-panel) py-(--space-section)')}>{children}</main>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };

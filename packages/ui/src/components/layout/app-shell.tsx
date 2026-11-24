import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { TextLink } from '../ui/text-link';
import { DEFAULT_APP_SHELL_MESSAGES, type AppShellMessages } from './app-shell.messages';

interface AppShellProps extends Omit<ComponentProps<'div'>, 'children'> {
  children: ReactNode;
  logoutHref?: string;
  messages?: Partial<AppShellMessages>;
}

const CONTENT_WIDTH_CLASS = 'mx-auto w-full max-w-240';
const LOGOUT_LINK_CLASS = 'inline-flex min-h-control items-center text-primary-foreground hover:text-primary-foreground';

function AppShell({ children, logoutHref, messages, className, ...props }: AppShellProps) {
  const text = { ...DEFAULT_APP_SHELL_MESSAGES, ...messages };

  return (
    <div data-slot="app-shell" className={cn('flex min-h-screen flex-col bg-background text-foreground', className)} {...props}>
      <header className="bg-primary text-primary-foreground">
        <div className={cn(CONTENT_WIDTH_CLASS, 'flex items-center justify-between gap-(--space-within-group) p-(--space-panel)')}>
          <p className="min-w-0 text-xl font-semibold leading-base">{text.productName}</p>
          {logoutHref === undefined ? null : (
            <TextLink href={logoutHref} className={LOGOUT_LINK_CLASS}>
              {text.logoutLabel}
            </TextLink>
          )}
        </div>
      </header>
      <main className={cn(CONTENT_WIDTH_CLASS, 'flex-1 px-(--space-panel) py-(--space-section)')}>{children}</main>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };

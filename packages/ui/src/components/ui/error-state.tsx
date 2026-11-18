import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import type { StateTitleLevel } from './empty-state';

interface ErrorStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string;
  description?: string;
  retryLabel: string;
  onRetry: () => void;
  retrying?: boolean;
  announce?: boolean;
  titleLevel?: StateTitleLevel;
}

function ErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  retrying = false,
  announce = false,
  titleLevel: Heading = 'h3',
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      data-slot="error-state"
      role={announce ? 'alert' : undefined}
      className={cn('flex flex-col items-start gap-(--space-within-group)', className)}
      {...props}
    >
      <Heading data-slot="error-state-title" className="min-w-0 text-base font-semibold leading-base wrap-anywhere">
        {title}
      </Heading>
      {description ? (
        <p data-slot="error-state-description" className="max-w-prose text-sm leading-base text-muted-foreground wrap-anywhere">
          {description}
        </p>
      ) : null}
      <Button loading={retrying} onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}

export { ErrorState };
export type { ErrorStateProps };

import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';
import { Button } from './button';

type StateTitleLevel = 'h2' | 'h3' | 'h4';

interface EmptyStateAction {
  readonly label: string;
  readonly onClick: () => void;
}

interface EmptyStateProps extends Omit<ComponentProps<'div'>, 'title'> {
  title: string;
  description?: string;
  action?: EmptyStateAction;
  titleLevel?: StateTitleLevel;
}

function EmptyState({ title, description, action, titleLevel: Heading = 'h3', className, ...props }: EmptyStateProps) {
  return (
    <div data-slot="empty-state" className={cn('flex flex-col items-start gap-(--space-within-group)', className)} {...props}>
      <Heading data-slot="empty-state-title" className="min-w-0 text-base font-semibold leading-base wrap-anywhere">
        {title}
      </Heading>
      {description ? (
        <p data-slot="empty-state-description" className="max-w-prose text-sm leading-base text-muted-foreground wrap-anywhere">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateAction, EmptyStateProps, StateTitleLevel };

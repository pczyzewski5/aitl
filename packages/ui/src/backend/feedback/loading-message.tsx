import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

const DEFAULT_LOADING_MESSAGE = 'Ładowanie…';

interface LoadingMessageProps extends Omit<ComponentProps<'p'>, 'children'> {
  message?: string;
}

function LoadingMessage({ message = DEFAULT_LOADING_MESSAGE, className, ...props }: LoadingMessageProps) {
  return (
    <p data-slot="loading-message" role="status" className={cn('text-sm leading-base text-muted-foreground wrap-anywhere', className)} {...props}>
      {message}
    </p>
  );
}

export { DEFAULT_LOADING_MESSAGE, LoadingMessage };
export type { LoadingMessageProps };

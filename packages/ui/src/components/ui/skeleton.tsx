import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden="true" className={cn('h-4 w-full rounded-control bg-muted', className)} {...props} />;
}

export { Skeleton };

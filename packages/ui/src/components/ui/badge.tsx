import type { ComponentProps } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

type BadgeVariant = 'neutral' | 'shared' | 'personal';

const badgeVariants = cva(
  'inline-flex max-w-full items-center rounded-pill px-2 py-1 text-sm font-normal leading-base break-words',
  {
    variants: {
      variant: {
        neutral: 'bg-background text-foreground',
        shared: 'bg-badge-shared text-badge-shared-foreground',
        personal: 'bg-badge-personal text-badge-personal-foreground',
      } satisfies Record<BadgeVariant, string>,
    },
  },
);

interface BadgeProps extends ComponentProps<'span'> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
export type { BadgeProps, BadgeVariant };

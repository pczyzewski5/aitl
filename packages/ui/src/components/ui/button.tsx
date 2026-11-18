'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-control text-sm leading-base text-center transition-colors duration-(--duration-feedback) disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground enabled:not-aria-disabled:hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground aria-disabled:bg-muted aria-disabled:text-muted-foreground',
        secondary:
          'bg-muted text-foreground enabled:not-aria-disabled:hover:bg-muted-hover disabled:text-muted-foreground aria-disabled:text-muted-foreground',
        ghost:
          'bg-transparent text-foreground enabled:not-aria-disabled:hover:bg-muted disabled:text-muted-foreground aria-disabled:text-muted-foreground',
        destructive:
          'bg-destructive text-destructive-foreground enabled:not-aria-disabled:hover:bg-destructive-hover disabled:bg-muted disabled:text-muted-foreground aria-disabled:bg-muted aria-disabled:text-muted-foreground',
      },
      size: {
        default: 'min-h-control px-4 py-1',
        icon: 'size-control',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  onClick,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <Component
      data-slot="button"
      data-variant={variant}
      data-size={size}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      className={cn(buttonVariants({ variant, size, className }))}
      onClick={handleClick}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
